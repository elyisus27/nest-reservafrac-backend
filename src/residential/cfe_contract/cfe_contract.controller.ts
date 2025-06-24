import { Controller, Get, Post, Body, Patch, Param, Delete, ParseBoolPipe, ParseIntPipe, Query } from '@nestjs/common';
import { CfeContractService } from './cfe_contract.service';
import { CreateCfeContractDto } from './dto/create-cfe_contract.dto';
import { UpdateCfeContractDto } from './dto/update-cfe_contract.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';

@Controller('cfe-contract')
export class CfeContractController {
  constructor(private readonly cfeContractService: CfeContractService) { }

  @Post()
  create(@Body() createCfeContractDto: CreateCfeContractDto) {
    return this.cfeContractService.create(createCfeContractDto);
  }



  @Get('init-telegram')
  initTelegram() {
    return this.cfeContractService.initTelegram();
  }

  @Get('listPaginated')
  listPaginated(@Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('searchtxt',) searchtxt: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('showInactives', ParseBoolPipe) showInactives: boolean,) {

    const filters: TableFiltersDto = {
      page: page,
      limit: limit,
      searchtxt: searchtxt,
      start: new Date(`${start}T00:00:00.000-06:00`),
      end: new Date(`${end}T23:59:59.0000-06:00`),
      showInactives: showInactives
    }

    return this.cfeContractService.listPaginated(filters)
  }
  // async cashConvert(@Param('connectionId') connectionId: string, @Param('folio') folio: string, @Res() res: Response) {
  //   let response = await this.cashConvertSvc.cashConvertTicket(+connectionId, +folio);
  //   res.send({ success: response.success, data: response.data, message: response.message, exception: response.exception });
  // }


  // @Get('pump-status')
  // async getPumpStatus(@Query('dispensaryId') dispensaryId: number, @Res() response,) {

  //   this.apiService.getPumpStatus(dispensaryId).then((result) => {
  //     response.status(200).json(result);
  //   }).catch((err) => {
  //     response.status(403).json(err);
  //   });
  // }

  @Get('register-contracts')
  registerAllFromBot() {
    return this.cfeContractService.registerContracts();
  }


  @Get('update-balance')
  updateDebts() {
    return this.cfeContractService.updateBalance();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cfeContractService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCfeContractDto: UpdateCfeContractDto) {
    return this.cfeContractService.update(+id, updateCfeContractDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cfeContractService.remove(+id);
  }
}
