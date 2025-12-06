// src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';  // Importar o módulo

@Module({
  imports: [RabbitMQModule],  // Importar o módulo que contém RabbitMQService
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}