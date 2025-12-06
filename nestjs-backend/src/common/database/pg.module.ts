import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg'; // Pool para melhor desempenho e escalabilidade
import { PG_POOL } from './pg.constants'; // constante para o token


@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      // Injeta ConfigService na useFactory
      useFactory: async (configService: ConfigService): Promise<Pool> => {
        const pool = new Pool({
          user: configService.get<string>('DB_USERNAME'),
          host: configService.get<string>('DB_HOST'),
          database: configService.get<string>('DB_DATABASE'),
          password: configService.get<string>('DB_PASSWORD'),
          port: configService.get<number>('DB_PORT'),
        });

        // O pool gerencia a conexão automaticamente, mas você pode testar a conexão:
        try {
            await pool.connect(); 
            console.log('PostgreSQL Pool conectado com Sucesso.');
        } catch (error) {
            console.error('Falha ao conectar ao PostgreSQL Pool:', error);
        }

        return pool;
      },
      // ConfigService precisa ser injetado na useFactory
      inject: [ConfigService], 
    },
  ],
  exports: [PG_POOL],
})
export class PgModule implements OnModuleDestroy {
   // Injetando a instância do pool no construtor do módulo
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Hook de ciclo de vida chamado antes que o módulo seja destruído (e a aplicação encerrada).
   * Usado para fechar o pool de conexões.
   */
  // para efeito de desenvolvimento utilizar sem assync await
  // mas em produção é necessario utilizar async onModuleDestroy() e await this.pool.end()
  onModuleDestroy() {
    if (this.pool) {
      console.log('Fechando o pool de conexões PostgreSQL...');
      // O método .end() drena o pool de todos os clientes ativos e os desconecta.
      this.pool.end(); 
      console.log('Pool de conexões PostgreSQL fechado.');
    }
  }
}
