import { Test, TestingModule } from '@nestjs/testing';
import { PaymentConsumer } from './payment-consumer.controller';
import { PaymentConsumerService } from './payment-consumer.service';

describe('PaymentConsumerController', () => {
  let controller: PaymentConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentConsumer],
      providers: [PaymentConsumerService],
    }).compile();

    controller = module.get<PaymentConsumer>(PaymentConsumer);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
