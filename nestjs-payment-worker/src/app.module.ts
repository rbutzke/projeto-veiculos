// src/app.module.ts
import { Global, Module } from '@nestjs/common';
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service';
import { PgModule } from './common/database/pg.module'; // ajuste o caminho conforme necessário
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    PgModule, // Importa o módulo do PostgreSQL
    ConfigModule.forRoot({
      isGlobal: true, // Para tornar as variáveis de ambiente disponíveis globalmente
    }),
  ],
  providers: [PaymentConsumerService],
})
export class AppModule {}