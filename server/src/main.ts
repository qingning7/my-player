import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      try {
        const { hostname, protocol } = new URL(origin);
        if (
          protocol === 'http:' &&
          (hostname === 'localhost' || hostname === '127.0.0.1')
        ) {
          callback(null, true);
          return;
        }
      } catch {
        // fall through
      }
      callback(new Error('Not allowed by CORS'), false);
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
