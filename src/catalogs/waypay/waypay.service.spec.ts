import { Test, TestingModule } from '@nestjs/testing';
import { WaypayService } from './waypay.service';

describe('WaypayService', () => {
  let service: WaypayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaypayService],
    }).compile();

    service = module.get<WaypayService>(WaypayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
