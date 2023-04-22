import { Module } from '@nestjs/common';
import { WaypayService } from './waypay.service';
import { WaypayController } from './waypay.controller';

@Module({
  controllers: [WaypayController],
  providers: [WaypayService]
})
export class WaypayModule {}
