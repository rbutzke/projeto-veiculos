import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class PaymentConsumer {
  private readonly logger = new Logger(PaymentConsumer.name);

  @EventPattern('payment_created') 
  async handlePaymentCreated(@Payload() data: any) {
    this.logger.log(`💰 Processando pagamento: ${data.id}`);
    this.logger.debug('Dados recebidos:', data);
    
    try {
      // Simula processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Lógica de processamento
      const processed = {
        ...data,
        status: 'completed',
        processedAt: new Date().toISOString(),
        transactionId: `tx_${Date.now()}`,
      };
      
      this.logger.log(`✅ Pagamento ${data.id} processado com sucesso!`);
      this.logger.log(`📊 Valor: ${data.amount} | Cliente: ${data.id}`);
      
      return processed;
      
    } catch (error) {
      this.logger.error(`❌ Erro ao processar pagamento ${data.id}:`, error);
      throw error; // Rejeita a mensagem para reprocessamento
    }
  }
}