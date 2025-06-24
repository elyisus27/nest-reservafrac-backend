import { Injectable } from '@nestjs/common';
import { CreateCfeContractDto } from './dto/create-cfe_contract.dto';
import { UpdateCfeContractDto } from './dto/update-cfe_contract.dto';
import { DataSource, In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { CfeContract } from './entities/cfe_contract.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as puppeteer from 'puppeteer';
import { CFE_PWD, CFE_URL, CFE_USER, DB_TYPE } from '../../config/constants';
import { ConfigService } from '@nestjs/config';
const puppeteerExtra = puppeteer as unknown as puppeteer.Puppeteer & { Page: any };

@Injectable()
export class CfeContractService {
  constructor(
    private ds: DataSource,
    @InjectRepository(CfeContract)
    private cfeRepo: Repository<CfeContract>,
    private configService: ConfigService
  ) { }

  create(createCfeContractDto: CreateCfeContractDto) {
    return 'This action adds a new cfeContract';
  }

  async listPaginated(filters: TableFiltersDto) {

    try {
      let tagActivefilter = filters.showInactives == true ? 0 : 1;

      const SKIP = filters.limit * (filters.page - 1);

      const queryBuilder = this.cfeRepo.createQueryBuilder('q')
        .select('q.contract_id AS contractId, q.street,  q.receipt_date AS receiptDate, q.payment_status AS paymentStatus, q.billingPeriod AS billingPeriod')
        //.addSelect(`CASE q.billing_period WHEN 1 THEN 'Mensual' WHEN 2 THEN 'Bimestral' ELSE 'desconocido' END`, 'billingPeriod') - cambiarlo por 
        //.addSelect(`CASE q.payment_status WHEN 1 THEN 'No Pagado' WHEN 2 THEN 'Pagado' ELSE 'desconocido' END`, 'paymentStatus')
        .addSelect('q.receipt_months AS receiptMonths, q.service_number AS serviceNumber, q.meter_number AS meterNumber')
        .addSelect(' q.client_name AS clientName, q.payment_due_date AS paymentDueDate,   CONCAT("$", FORMAT(q.total,2)) AS total, DATE_FORMAT(updated_at,"%d/%m/%y %H:%i") AS updatedAt')
        .skip(SKIP)
        .take(filters.limit)
        .where(
          [{
            //loadingDate: Between(filters.start, filters.end), //and
            tagActive: MoreThanOrEqual(tagActivefilter),//and
            //comments: Like(`%${filters.searchtxt}%`) ,//and
          },//or
          {
            //loadingDate: Between(filters.start, filters.end),
            tagActive: MoreThanOrEqual(tagActivefilter),
            //clientName: Like(`%${filters.searchtxt}%`),

          },
          ],
        )

      const total = await queryBuilder.getCount();
      const list = await queryBuilder.getRawMany();


      return { success: true, data: { items: list, totalItems: total } };
    } catch (error) {
      return { success: false, message: error.message, error: error }
    }


  }

  async updateBalance() {
    try {
      //puppeteer.use(StealthPlugin());
      const browser = await puppeteer.launch({
        headless: true, // o true si usas Puppeteer < 20
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9',
      });

      await this.loginToMicfe(page); // 👈 Login modularizado

      // 2. Espera a que aparezca el dropdown de contratos
      await page.waitForSelector('#ctl00_MainContent_ddlServicios',{ timeout: 60000 });

      const options = await page.$$eval(
        '#ctl00_MainContent_ddlServicios option',
        opts => opts.map(o => ({ value: o.value, text: o.textContent }))
      );

      const newData = [];

      for (const opt of options) {
        await page.select('#ctl00_MainContent_ddlServicios', opt.value);

        await page.waitForFunction(
          `document.querySelector("#ctl00_MainContent_lblNumeroServicio")?.innerText.replace(/\\s/g, '').includes("${opt.value}")`,
          { timeout: 10000 }
        );

        const receipt = await page.evaluate(() => {
          return {
            total: document.querySelector('#ctl00_MainContent_lblMonto')?.textContent?.replace(/\$/g, '')?.trim() || '',
            billingPeriod: document.querySelector('#ctl00_MainContent_lblPeriodoConsumo')?.textContent?.trim() || '',
            paymentDueDate: document.querySelector('#ctl00_MainContent_lblFechaLimite')?.textContent?.trim() || '',
            paymentStatus: document.querySelector('#ctl00_MainContent_lblEstadoRecibo')?.textContent?.trim() || ''
          };
        });

        newData.push({ serviceNumber: opt.value, ...receipt });
      }

      await browser.close();

      const serviceNumbers = newData.map(d => d.serviceNumber);

      const existingContracts = await this.cfeRepo.find({
        where: { serviceNumber: In(serviceNumbers) }
      });

      const mergedContracts = existingContracts.map(contract => {
        const updated = newData.find(d => d.serviceNumber === contract.serviceNumber);
        if (updated) return Object.assign(contract, updated);
        return contract;
      });

      let saved = await this.cfeRepo.save(mergedContracts);
      return { success: true, data: saved };

    } catch (error) {
      return { success: false, message: error.message, error: error }
    }
  }

  async initTelegram() {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './sessions/telegram' // compartido entre sesiones
      });

      const page = await browser.newPage();
      await page.goto('https://web.telegram.org/k/', {
        waitUntil: 'networkidle2'
      });

      console.log('✅ Telegram Web abierto. Escanea el QR para iniciar sesión manual.');
      return { success: true, message: 'Escanea el QR en Telegram Web para iniciar sesión manual.' };

    } catch (error) {
      console.error('❌ Error al iniciar Telegram Web:', error);
      return { success: false, message: 'Error al iniciar Telegram Web', error };
    }
  }

  async registerContracts() {
    try {

      const activeInMicfe = await this.getActiveContractsFromMicfe();
      const contractsToRegister = await this.cfeRepo.find({
        where: {
          serviceNumber: Not(In(activeInMicfe)),
          tagActive: 1,
        },
      });

      const telegramBrowser = await puppeteer.launch({ headless: false, userDataDir: './sessions/telegram' });
      const telegramPage = await telegramBrowser.newPage();
      await telegramPage.goto('https://web.telegram.org/k/', { waitUntil: 'networkidle2' });
      await this.openChatWithCFE(telegramPage);

      const telegramResults = [];
      for (const contract of contractsToRegister) {
        console.log(`Iterando: ${contract.serviceNumber}`);
        const result = await this.handleTelegramInteraction(telegramPage, contract);
        telegramResults.push(result);
      }

      await telegramBrowser.close();

      const micfeBrowser = await puppeteer.launch({ headless: false });
      const micfePage = await micfeBrowser.newPage();
      await this.loginToMicfe(micfePage);

      for (const data of telegramResults) {
        await this.registerInMicfe(micfePage, data);
      }

      await micfeBrowser.close();

    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Error al consultar saldo',
        error,
      };
    }
  }

  //#region internal functions

  private async loginToMicfe(page: puppeteer.Page) {
    await page.goto(this.configService.get(CFE_URL));
    await page.type('#ctl00_MainContent_txtUsuario', this.configService.get(CFE_USER));
    await page.type('#ctl00_MainContent_txtPassword', this.configService.get(CFE_PWD));
    await Promise.all([
      page.click('#ctl00_MainContent_btnIngresar'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
  }

  async getActiveContractsFromMicfe(): Promise<string[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(this.configService.get<string>(CFE_URL));

    await page.type('#ctl00_MainContent_txtUsuario', this.configService.get<string>(CFE_USER));
    await page.type('#ctl00_MainContent_txtPassword', this.configService.get<string>(CFE_PWD));

    await Promise.all([
      page.click('#ctl00_MainContent_btnIngresar'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await page.waitForSelector('#ctl00_MainContent_ddlServicios');
    const options = await page.$$eval(
      '#ctl00_MainContent_ddlServicios option',
      opts => opts.map(o => o.value)
    );

    await browser.close();
    return options;
  }

  private async handleTelegramInteraction(page: puppeteer.Page, contract: CfeContract): Promise<{ serviceNumber: string; amount: number; clientName: string; street: string }> {
    await this.sendMessage(page, 'hola');
    await this.sendMessage(page, '2');
    await this.sendMessage(page, '1');
    await this.sendMessage(page, contract.serviceNumber);
    await new Promise(res => setTimeout(res, 2000));

    const response = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('.text-content'));
      return msgs[msgs.length - 1]?.textContent || '';
    });

    let amount = 0;
    if (!response.includes('no presenta adeudo')) {
      const match = response.match(/\$?\s?([\d,]+\.\d{2})/);
      if (match) {
        amount = parseFloat(match[1].replace(',', ''));
      }
    }

    await this.sendMessage(page, 'salir');
    return {
      serviceNumber: contract.serviceNumber,
      amount,
      clientName: contract.clientName,
      street: contract.street,
    };
  }

  private async registerInMicfe(page: puppeteer.Page, data: { serviceNumber: string; amount: number; clientName: string; street: string }) {
    console.log('📎 Navegando a "Administrar mis recibos"...');
    await new Promise(res => setTimeout(res, 500));
    await page.waitForSelector('a.list-group-item[href="AdministrarServicios.aspx"]', { timeout: 60000 });
    await page.click('a.list-group-item[href="AdministrarServicios.aspx"]');
    await new Promise(res => setTimeout(res, 500)); // delay compatible
    await page.waitForSelector('a[href="AgregarServicio.aspx"]', { timeout: 10000 });
    await page.click('a[href="AgregarServicio.aspx"]');
    await new Promise(res => setTimeout(res, 500)); // delay compatible
    await page.waitForSelector('#ctl00_MainContent_txtRpu');

    console.log('📝 Llenando formulario de nuevo recibo...');

    // 1. Llenar inputs
    await page.type('#ctl00_MainContent_txtRpu', data.serviceNumber);
    await page.type('#ctl00_MainContent_txtNombreServicio', data.clientName);
    await page.type('#ctl00_MainContent_txtTotalAPagar', data.amount.toFixed(2));
    await page.type('#ctl00_MainContent_txtNombreCorto', data.street);

    // 2. Click en guardar
    await page.click('#ctl00_MainContent_btnGuardar');

    // 3. Esperar mensaje de éxito (pero solo si aún no estaba)
    await page.waitForFunction(() => {
      const msg = document.querySelector('#ctl00_MainContent_lblExito');
      return msg && msg.textContent?.includes('agregado exitosamente');
    }, { timeout: 5000 });
    await new Promise(res => setTimeout(res, 500)); // delay compatible
    // 4. Limpiar inputs para siguiente iteración
    await page.evaluate(() => {
      (document.getElementById('ctl00_MainContent_txtRpu') as HTMLInputElement).value = '';
      (document.getElementById('ctl00_MainContent_txtNombreServicio') as HTMLInputElement).value = '';
      (document.getElementById('ctl00_MainContent_txtTotalAPagar') as HTMLInputElement).value = '';
      (document.getElementById('ctl00_MainContent_txtNombreCorto') as HTMLInputElement).value = '';
    });

    console.log(`✅ Contrato ${data.serviceNumber} guardado en MiCFE`);
  }




  async openChatWithCFE(page: puppeteer.Page): Promise<boolean> {
    try {
      console.log('🔍 4.1 - Esperando input de búsqueda...');
      await page.waitForSelector('.input-search input', { timeout: 20000 });
      const searchInput = await page.$('.input-search input');
      if (!searchInput) throw new Error('No se encontró input de búsqueda');

      console.log('⌨️ 4.2 - Escribiendo @CFEContigo...');
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await searchInput.type('@CFEContigo', { delay: 100 });

      console.log('🕵️ 4.3 - Esperando div.selector-user que contenga "CFEContigo"...');
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('div.selector-user')).some(div =>
          div.textContent?.includes('CFEContigo')
        );
      }, { timeout: 20000 });

      console.log('🖱️ 4.4 - Haciendo click en div.selector-user...');
      await page.evaluate(() => {
        const selectorUsers = Array.from(document.querySelectorAll('div.selector-user')) as HTMLElement[];
        const cfeDiv = selectorUsers.find(div =>
          div.textContent?.includes('CFEContigo')
        );
        cfeDiv?.click();
      });

      console.log('⏳ 4.5 - Esperando a que cargue la sección de chats con CFEContigo...');
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('ul.chatlist a')).some(a =>
          a.textContent.includes('CFEContigo') &&
          window.getComputedStyle(a).display !== 'none' &&
          (a as HTMLElement).offsetParent !== null
        );
      });

      console.log('🔍 4.6 - Buscando el primer chat visible con CFEContigo...');
      const chatHandle = await page.evaluateHandle(() => {
        const chat = Array.from(document.querySelectorAll('ul.chatlist a')).find(a =>
          a.textContent.includes('CFEContigo') &&
          window.getComputedStyle(a).display !== 'none' &&
          (a as HTMLElement).offsetParent !== null
        );
        return chat || null;
      });

      if (!chatHandle) {
        console.warn('⚠️ 4.7 - No se encontró el chat visible con CFEContigo');
        return false;
      }

      console.log('🖱️ 4.8 - Haciendo click en el chat visible con CFEContigo...');
      const element = chatHandle.asElement();
      if (element) {
        await (element as puppeteer.ElementHandle<Element>).click();
        console.log('✅ 4.9 - Click exitoso en el chat de CFEContigo');
      } else {
        console.warn('⚠️ 4.9 - No se pudo convertir a elemento para click');
        return false;
      }

      return true;



    } catch (error) {
      console.error('❌ Error en openChatWithCFE:', error);
      return false;
    }
  }



  async sendMessage(page: puppeteer.Page, message: string) {
    const inputSelector = 'div.input-message-input[contenteditable="true"]';

    await page.waitForSelector(inputSelector, { timeout: 15000 });
    const input = await page.$(inputSelector);

    if (!input) {
      throw new Error('Input de mensaje no encontrado');
    }

    await input.focus();
    await page.keyboard.type(message, { delay: 50 });
    await page.keyboard.press('Enter');
    await new Promise(res => setTimeout(res, 1000)); // delay compatible
  }



  //#endregion

  findOne(id: number) {
    return `This action returns a #${id} cfeContract`;
  }

  update(id: number, updateCfeContractDto: UpdateCfeContractDto) {
    return `This action updates a #${id} cfeContract`;
  }

  remove(id: number) {
    return `This action removes a #${id} cfeContract`;
  }
}
