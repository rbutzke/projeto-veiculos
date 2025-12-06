// src/app.module.ts
import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    RabbitMQModule,
    PaymentModule,
  ],
})
export class AppModule {}