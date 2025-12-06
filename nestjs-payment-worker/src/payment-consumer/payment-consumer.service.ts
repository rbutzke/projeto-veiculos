// src/payment-consumer.service.ts - USANDO AMQPLIB
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentConsumerService.name);
  private channel: any = null;

  async onModuleInit() {
    await this.connectAndConsume();
  }

  async connectAndConsume() {
    try {
      const amqp = await import('amqplib');
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
      
      this.logger.log('📞 Conectando ao RabbitMQ...');
      const connection = await amqp.connect(url);
      this.channel = await connection.createChannel();
      
      // Configurar a fila (deve ser a mesma do producer)
      await this.channel.assertQueue('payment_queue', { durable: true });
      
      // Prefetch para controlar o fluxo
      await this.channel.prefetch(1);
      
      this.logger.log('✅ Conectado ao RabbitMQ');
      this.logger.log('🗂️ Consumindo da fila: payment_queue');
      
      // Consumir mensagens
      await this.channel.consume('payment_queue', async (msg: any) => {
        if (msg !== null) {
          try {
            const message = JSON.parse(msg.content.toString());
            this.logger.log(`💰 Nova mensagem recebida: ${message.id}`);
            
            // Processa o pagamento
            await this.processPayment(message);
            
            // Confirma o processamento (ack)
            this.channel.ack(msg);
            this.logger.log(`✅ Mensagem ${message.id} processada com sucesso`);
            
          } catch (error: any) {
            this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`);
            // Rejeita a mensagem (pode ser reprocessada)
            this.channel.nack(msg, false, true);
          }
        }
      });
      
      // Trata erros
      connection.on('error', (err: Error) => {
        this.logger.error(`Erro de conexão: ${err.message}`);
      });
      
    } catch (error: any) {
      this.logger.error(`Falha ao conectar: ${error.message}`);
      setTimeout(() => this.connectAndConsume(), 5000);
    }
  }

  async processPayment(data: any) {
    this.logger.log(`\n✅ PROCESSANDO PAGAMENTO:`);
    this.logger.log(`   ID: ${data.id}`);
    this.logger.log(`   Cliente: ${data.clientId}`);
    this.logger.log(`   Valor: ${data.amount} ${data.currency}`);
    this.logger.log(`   Descrição: ${data.description || 'N/A'}`);
    
    // Simula processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. Salvar no banco
    // await this.saveToDatabase(data);
    
    this.logger.log(`--- Processamento concluído ---`);
  }
}
