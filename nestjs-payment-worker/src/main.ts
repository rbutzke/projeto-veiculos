// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Bootstrap');
  
  logger.log('🚀 Worker de pagamentos iniciado!');
  logger.log('📞 Aguardando mensagens do RabbitMQ...');
  
  // Mantém a aplicação rodando
  await app.init();
}
bootstrap();