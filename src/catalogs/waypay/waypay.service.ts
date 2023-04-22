import { Injectable } from '@nestjs/common';
import { CreateWaypayDto } from './dto/create-waypay.dto';
import { UpdateWaypayDto } from './dto/update-waypay.dto';

@Injectable()
export class WaypayService {
  create(createWaypayDto: CreateWaypayDto) {
    return 'This action adds a new waypay';
  }

  findAll() {
    return `This action returns all waypay`;
  }

  findOne(id: number) {
    return `This action returns a #${id} waypay`;
  }

  update(id: number, updateWaypayDto: UpdateWaypayDto) {
    return `This action updates a #${id} waypay`;
  }

  remove(id: number) {
    return `This action removes a #${id} waypay`;
  }
}
