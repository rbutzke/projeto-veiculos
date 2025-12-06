import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private amqpConnection: any = null;
  private channel: any = null;
  
  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    try {
      const amqp = await import('amqplib');
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      
      this.logger.log(`Conectando ao RabbitMQ: ${url}`);
      this.amqpConnection = await amqp.connect(url);
      this.channel = await this.amqpConnection.createChannel();
      
      // Configurar exchange, queue e binding
      await this.channel.assertExchange('payments', 'direct', { durable: true });
      await this.channel.assertQueue('payment_queue', { durable: true });
      await this.channel.bindQueue('payment_queue', 'payments', 'payment.process');
      
      this.logger.log('✅ RabbitMQ configurado com sucesso');
      
    } catch (error: any) {
      this.logger.error(`Falha ao conectar: ${error.message}`);
    }
  }

  async publish(message: any): Promise<boolean> {
    try {
      const sent = this.channel.publish(
        'payments',
        'payment.process',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      
      if (sent) {
        this.logger.log(`✅ Mensagem enviada: ${message.id}`);
      }
      
      return sent;
    } catch (error: any) {
      this.logger.error(`Erro ao publicar: ${error.message}`);
      throw error;
    }
  }
}