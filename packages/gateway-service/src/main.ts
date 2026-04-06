import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';

import { GatewayModule } from './infrastructure/nestjs/gateway.module';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(GatewayModule, {
    cors: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);

  return app;
}

void bootstrap();
