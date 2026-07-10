import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setupSwagger } from './config/swagger.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('apiPrefix', 'api');
  const port = configService.get<number>('port', 3001);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const corsOrigin = configService.get<string>('cors.origin', 'http://localhost:3000');
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', nodeEnv !== 'production');

  if (nodeEnv === 'production' && /localhost|127\.0\.0\.1/i.test(corsOrigin)) {
    throw new Error('CORS_ORIGIN must not be localhost in production');
  }

  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (swaggerEnabled) {
    setupSwagger(app, apiPrefix);
  }

  await app.listen(port);
}

void bootstrap();
