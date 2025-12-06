// src/app.module.ts
import { Module } from '@nestjs/common';
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service';

@Module({
  imports: [],
  providers: [PaymentConsumerService],
})
export class AppModule {}