import { PartialType } from '@nestjs/swagger';
import { CreateCfeContractDto } from './create-cfe_contract.dto';

export class UpdateCfeContractDto extends PartialType(CreateCfeContractDto) {}
