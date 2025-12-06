import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentConsumer } from './payment-consumer.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
  ],
  controllers: [PaymentConsumer], // Seu controller/consumer
})
export class PaymentConsumerModule {}