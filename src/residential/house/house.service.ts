import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { DataSource } from 'typeorm';
import { ResHouse } from './entities/house.entity';
import { MessageDto } from 'src/globals/message.dto';

@Injectable()
export class HouseService {
  constructor(
    private ds: DataSource,
  ) { }

  create(createHouseDto: CreateHouseDto) {
    return 'This action adds a new house';
  }

  async findAll() {
    const repoHouse = this.ds.getRepository<ResHouse>(ResHouse)
    // const houses = await repoHouse.find();

    try {
      const queryBuilder = repoHouse.createQueryBuilder('h')
        .innerJoinAndSelect('h.clients', 'clients')
        .select('h.houseId', 'houseId')
        .addSelect('h.street', 'street')
        .addSelect('h.exteriorNumber', 'exteriorNumber')
        .addSelect('clients.lastName', 'lastName')
        .addSelect('clients.motherLastName', 'motherLastName')
        .addSelect('clients.firstName', 'firstName')
        .addSelect('h.debtor', 'debtor')

      let houses = await queryBuilder.getRawMany();
      if (!houses) throw new NotFoundException(new MessageDto('lista vacía'))
      return houses
    } catch (error) {
      console.log(error)
      throw new NotFoundException(new MessageDto(error.message))
    }




  }

  findOne(id: number) {
    return `This action returns a #${id} house`;
  }

  update(id: number, updateHouseDto: UpdateHouseDto) {
    return `This action updates a #${id} house`;
  }

  remove(id: number) {
    return `This action removes a #${id} house`;
  }
}
