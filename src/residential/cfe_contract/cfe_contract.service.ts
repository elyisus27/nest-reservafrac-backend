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
        .select('q.contract_id AS contractId, q.street,  q.receipt_date AS receiptDate, q.payment_status AS paymentStatus')
        .addSelect(`CASE q.billing_period WHEN 1 THEN 'Mensual' WHEN 2 THEN 'Bimestral' ELSE 'desconocido' END`, 'billingPeriod')
        //.addSelect(`CASE q.payment_status WHEN 1 THEN 'No Pagado' WHEN 2 THEN 'Pagado' ELSE 'desconocido' END`, 'paymentStatus')
        .addSelect('q.receipt_months AS receiptMonths, q.service_number AS serviceNumber, q.meter_number AS meterNumber')
        .addSelect(' q.client_name AS clientName, q.payment_due_date AS paymentDueDate, q.total AS total, DATE_FORMAT(updated_at,"%d/%m/%y %H:%i") AS updatedAt')
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
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(this.configService.get<any>(CFE_URL));

      // 1. Login
      await page.type('#ctl00_MainContent_txtUsuario', this.configService.get<any>(CFE_USER));
      await page.type('#ctl00_MainContent_txtPassword', this.configService.get<any>(CFE_PWD));
      await Promise.all([
        page.click('#ctl00_MainContent_btnIngresar'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);

      // 2. Espera a que aparezca el dropdown de contratos
      await page.waitForSelector('#ctl00_MainContent_ddlServicios');

      const options = await page.$$eval(
        '#ctl00_MainContent_ddlServicios option',
        opts => opts.map(o => ({ value: o.value, text: o.textContent }))
      );

      const newData = [];

      for (const opt of options) {
        await page.select('#ctl00_MainContent_ddlServicios', opt.value);

        await page.waitForFunction(
          `document.querySelector("#ctl00_MainContent_lblNumeroServicio")?.innerText.replace(/\\s/g, '').includes("${opt.value}")`,
          { timeout: 10000 } // dale un poco más de margen si va lento
        );

        const receipt = await page.evaluate(() => {
          return {
            total: document.querySelector('#ctl00_MainContent_lblMonto')?.textContent?.replace(/\$/g, '')?.trim() || '',
            billingPeriod: document.querySelector('#ctl00_MainContent_lblPeriodoConsumo')?.textContent?.trim() || '',
            //numeroServicio: document.querySelector('#ctl00_MainContent_lblNumeroServicio')?.textContent?.trim() || '',
            paymentDueDate: document.querySelector('#ctl00_MainContent_lblFechaLimite')?.textContent?.trim() || '',
            paymentStatus: document.querySelector('#ctl00_MainContent_lblEstadoRecibo')?.textContent?.trim() || ''
          };
        });

        newData.push({ serviceNumber: opt.value, /*alias: opt.text,*/ ...receipt });
      }
      await browser.close();
      //console.log('Recibos:', newData);

      // 2. Extrae todos los serviceNumbers únicos
      const serviceNumbers = newData.map(d => d.serviceNumber);

      // 3. Busca registros existentes
      const existingContracts = await this.cfeRepo.find({
        where: {
          serviceNumber: In(serviceNumbers)
        }
      });

      // 4. Fusiona los datos nuevos en los registros existentes
      const mergedContracts = existingContracts.map(contract => {
        const updated = newData.find(d => d.serviceNumber === contract.serviceNumber);
        if (updated) {
          // Usa Object.assign para sobreescribir campos existentes
          return Object.assign(contract, updated);
        }
        return contract;
      });

      // 5. Guarda los contratos actualizados
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
    const activeInMicfe = await this.getActiveContractsFromMicfe();
    console.log(1)
    const contractsToRegister = await this.cfeRepo.find({
      where: {
        serviceNumber: Not(In(activeInMicfe)),
        tagActive: 1,
      }
    });


    console.log(2)
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: './sessions/telegram' // compartido entre sesiones
    });
    console.log(3)
    const page = await browser.newPage();

    await page.goto('https://web.telegram.org/k/', { waitUntil: 'networkidle2' });
    await this.openChatWithCFE(page);

    // Itera por cada contrato
    for (const contract of contractsToRegister) {
      await this.sendMessage(page, 'hola');
      await this.sendMessage(page, '2');
      await this.sendMessage(page, '1');
      await this.sendMessage(page, contract.serviceNumber);


      await new Promise(res => setTimeout(res, 2000));
      const response = await page.evaluate(() => {
        const msgs = Array.from(document.querySelectorAll('.text-content'));
        return msgs[msgs.length - 1]?.textContent || '';
      });

      let monto = 0;
      if (response.includes('no presenta adeudo')) {
        monto = 0;
      } else {
        const match = response.match(/\$?\s?([\d,]+\.\d{2})/);
        if (match) {
          monto = parseFloat(match[1].replace(',', ''));
        }
      }

      // Guarda el contrato actualizado...
      console.log(`Servicio: ${contract.serviceNumber}, Monto: ${monto}`);

      await this.sendMessage(page, 'salir');
    }

  }


  //#region internal functions
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
