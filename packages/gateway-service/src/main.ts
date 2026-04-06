import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';

import { loadSamsRuntimeConfig } from '@sams/shared';

import { GatewayModule } from './infrastructure/nestjs/gateway.module';

interface RequestWithRawBody {
  rawBody?: Buffer;
}

export async function createGatewayApp(): Promise<INestApplication> {
  loadSamsRuntimeConfig();

  const app = await NestFactory.create(GatewayModule, {
    cors: true,
    bodyParser: false,
  });

  app.use(
    json({
      verify: (request, _response, buffer) => {
        (request as RequestWithRawBody).rawBody = Buffer.from(buffer);
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  return app;
}

export async function bootstrap(): Promise<INestApplication> {
  const runtimeConfig = loadSamsRuntimeConfig();
  const app = await createGatewayApp();

  await app.listen(runtimeConfig.port);

  return app;
}

if (require.main === module) {
  void bootstrap();
}
