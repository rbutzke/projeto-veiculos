import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { configureApp } from './app.config';
import * as bcrypt from 'bcrypt';

const httpsOptions = {
  key: fs.readFileSync('src/common/secrets/cert.key'),
  cert: fs.readFileSync('src/common/secrets/cert.crt'),
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Toda a configuração se encontra aqui app.config.ts
  configureApp(app); 

  await app.listen(process.env.PORT ?? 7777);
}

bootstrap();

export { configureApp };