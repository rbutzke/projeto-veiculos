import { Injectable } from '@nestjs/common';
import * as Prometheus from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly requestCount: Prometheus.Counter<string>;
  public readonly httpResponseTimeSeconds: Prometheus.Histogram<string>;

  constructor() {
    // Configurar labels padrão
    Prometheus.register.setDefaultLabels({ app: 'Veiculos' });

    this.requestCount = new Prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests made',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpResponseTimeSeconds = new Prometheus.Histogram({
      name: 'http_response_time_seconds',
      help: 'Duration of HTTP requests in seconds',
      buckets: [0.1, 0.5, 1, 2, 5],
      labelNames: ['method', 'route', 'status_code'],
    });

    Prometheus.register.registerMetric(this.requestCount);
    Prometheus.register.registerMetric(this.httpResponseTimeSeconds);
  }

  incrementRequestCount(labels?: Record<string, string>) {
    if (labels) {
      this.requestCount.inc(labels);
    } else {
      this.requestCount.inc();
    }
  }

  observeResponseTime(duration: number, labels?: Record<string, string>) {
    if (labels) {
      this.httpResponseTimeSeconds.observe(labels, duration / 1000);
    } else {
      this.httpResponseTimeSeconds.observe(duration / 1000);
    }
  }
}