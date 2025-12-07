import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQController } from './rabbitmq.controller';
import { RabbitMQService } from './rabbitmq.service';

describe('RabbitmqController', () => {
  let controller: RabbitMQController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RabbitMQController],
      providers: [RabbitMQService],
    }).compile();

    controller = module.get<RabbitMQController>(RabbitMQController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
