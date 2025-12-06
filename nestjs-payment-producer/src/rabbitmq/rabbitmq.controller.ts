import { Controller } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller()
export class RabbitMQController {
  constructor(private readonly rabbitmqService: RabbitMQService) {}
}
