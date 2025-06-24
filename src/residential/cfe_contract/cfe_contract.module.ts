import { Module } from '@nestjs/common';
import { CfeContractService } from './cfe_contract.service';
import { CfeContractController } from './cfe_contract.controller';
import { CfeContract } from './entities/cfe_contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CfeContract])],
  controllers: [CfeContractController],
  providers: [CfeContractService]
})
export class CfeContractModule { }
