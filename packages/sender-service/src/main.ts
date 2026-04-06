import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { loadSamsRuntimeConfig } from '@sams/shared';

import { SenderModule } from './infrastructure/nestjs/sender.module';

export async function createSenderApp(): Promise<INestApplication> {
  loadSamsRuntimeConfig();

  return NestFactory.create(SenderModule);
}

export async function bootstrap(): Promise<INestApplication> {
  const runtimeConfig = loadSamsRuntimeConfig();
  const app = await createSenderApp();

  await app.listen(runtimeConfig.port);

  return app;
}

if (require.main === module) {
  void bootstrap();
}
