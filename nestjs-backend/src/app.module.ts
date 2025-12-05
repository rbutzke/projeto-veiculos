import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehicleModule } from './vehicle/vehicle.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CustomLogger } from './common/pino/custom.logger';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PgModule } from './common/database/pg.module';

@Global()
@Module({
  imports: [
             // Módulos globais (carregados uma vez)
             PgModule,
             ConfigModule.forRoot({
               isGlobal: true,
             }),
              // Rate Limiting - proteção contra ataques de força bruta
              ThrottlerModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => [
                 {
                 ttl: config.get<number>('THROTTLE_TTL', 60000), // 1 minuto
                 limit: config.get<number>('THROTTLE_LIMIT', 50), // 10 requisições por minuto
                 },
             ],
           }),
             LoggerModule.forRoot({ pinoHttp: { level: 'trace' } }),
             // Módulos de funcionalidade
             VehicleModule, 
             AuthModule],
  controllers: [AppController],
  providers: [AppService, 
              CustomLogger,
             // Aplicar rate limiting globalmente
             {
               provide: APP_GUARD,
               useClass: ThrottlerGuard,
             },],
  exports: [CustomLogger],
})
export class AppModule {}

