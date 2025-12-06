// src/payment/payment.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/createPayment.dto';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() paymentDto: CreatePaymentDto) {
    this.logger.log('Recebida requisição de pagamento');
    return await this.paymentService.processPayment(paymentDto);
  }
}