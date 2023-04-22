import { PartialType } from '@nestjs/swagger';
import { CreateWaypayDto } from './create-waypay.dto';

export class UpdateWaypayDto extends PartialType(CreateWaypayDto) {}
