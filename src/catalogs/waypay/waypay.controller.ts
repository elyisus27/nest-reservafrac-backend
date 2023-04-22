import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WaypayService } from './waypay.service';
import { CreateWaypayDto } from './dto/create-waypay.dto';
import { UpdateWaypayDto } from './dto/update-waypay.dto';

@Controller('waypay')
export class WaypayController {
  constructor(private readonly waypayService: WaypayService) {}

  @Post()
  create(@Body() createWaypayDto: CreateWaypayDto) {
    return this.waypayService.create(createWaypayDto);
  }

  @Get()
  findAll() {
    return this.waypayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waypayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWaypayDto: UpdateWaypayDto) {
    return this.waypayService.update(+id, updateWaypayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waypayService.remove(+id);
  }
}
