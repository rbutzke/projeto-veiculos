import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController extends PrometheusController {
  constructor(private readonly metricsService: MetricsService) {
    super();
  }

  @Get('/metrics')
  async index(@Res({ passthrough: true }) response: unknown): Promise<string> {
    this.metricsService.incrementRequestCount({
      method: 'GET',
      route: '/metrics',
      status_code: '200'
    });

    const startTime = Date.now();
    const metrics = await super.index(response);
    const endTime = Date.now();
    
    this.metricsService.observeResponseTime(endTime - startTime, {
      method: 'GET',
      route: '/metrics',
      status_code: '200'
    });

    return metrics;
  }
}