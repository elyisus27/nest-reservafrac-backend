import { Test, TestingModule } from '@nestjs/testing';
import { WaypayController } from './waypay.controller';
import { WaypayService } from './waypay.service';

describe('WaypayController', () => {
  let controller: WaypayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaypayController],
      providers: [WaypayService],
    }).compile();

    controller = module.get<WaypayController>(WaypayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
