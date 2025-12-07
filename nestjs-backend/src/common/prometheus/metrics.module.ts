import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      // Configurações básicas do Prometheus
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
