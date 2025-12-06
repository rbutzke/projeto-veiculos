import { Test, TestingModule } from '@nestjs/testing';
import { PaymentConsumerController } from './payment-consumer.controller';
import { PaymentConsumerService } from './payment-consumer.service';

describe('PaymentConsumerController', () => {
  let controller: PaymentConsumerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentConsumerController],
      providers: [PaymentConsumerService],
    }).compile();

    controller = module.get<PaymentConsumerController>(PaymentConsumerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
