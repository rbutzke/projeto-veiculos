// src/payment-consumer.service.ts - USANDO AMQPLIB
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../common/database/pg.constants'; 

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentConsumerService.name);
  private channel: any = null;

  constructor(@Inject(PG_POOL) private readonly pool: Pool,) {}

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
    
     console.log('Testando conexão com PostgreSQL...');
     await this.pool.query('SELECT 1');
     console.log('✅ Conexão com PostgreSQL estabelecida');

     //SALVA NO BANCO DE DADOS
     await this.saveToDatabase(data); 

    this.logger.log(`✅ Mensagem ${data.id} processada com sucesso`);
    
  }

   async saveToDatabase(data: any): Promise<void> {
     try {
      this.logger.log('💾 Salvando pagamento no banco de dados...');
      
      // Query para inserir o pagamento
      const query = `
        INSERT INTO payments (clientId, description, amount, currency)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          clientId = EXCLUDED.clientId,
          description = EXCLUDED.description,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      
      // Valores para a query
      const values = [
        data.clientId,
        data.description || 'Pagamento sem descrição',
        data.amount,
        data.currency || 'BRL'
      ];


      // Executa a query usando o pool
      const result = await this.pool.query(query, values);
      
      this.logger.log(`✅ Pagamento salvo no banco. ID: ${result.rows[0].id}`);
      this.logger.log(`📊 Registro: ${JSON.stringify(result.rows[0])}`);
      
    } catch (error: any) {
      this.logger.error(`❌ Erro ao salvar no banco: ${error.message}`);
      this.logger.error(`🔍 Detalhes do erro: ${JSON.stringify(error)}`);
      
      // Relança o erro para que o consumidor possa fazer nack
      throw new Error(`Falha ao salvar pagamento no banco: ${error.message}`);
    }
  }

}
    
    
