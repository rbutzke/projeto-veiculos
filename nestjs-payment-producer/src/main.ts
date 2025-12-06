import fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
const app = await NestFactory.create(AppModule, {
  httpsOptions: {
     key: fs.readFileSync('src/common/secrets/cert.key'),
     cert: fs.readFileSync('src/common/secrets/cert.crt'),
  },
});

await app.listen(process.env.PORT ?? 7778);
}
bootstrap();


