// src/payment/payment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { CreatePaymentDto } from './dto/createPayment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async processPayment(paymentDto: CreatePaymentDto) {
    const paymentId = `pay_${paymentDto.clientId}_${Date.now()}`;
    
    const message = {
      ...paymentDto,
      id: paymentId,
      timestamp: new Date().toISOString(),
      source: 'api-producer'
    };

    this.logger.log(`Processando pagamento: ${paymentId}`);
    
    try {
      await this.rabbitMQService.publish(message);
      
      this.logger.log(`✅ Pagamento ${paymentId} encaminhado`);
      
      return {
        success: true,
        message: 'Pagamento encaminhado para processamento',
        paymentId,
        data: message,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      this.logger.error(`❌ Erro: ${error.message}`);
      throw error;
    }
  }
}