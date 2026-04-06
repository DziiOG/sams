import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { loadSamsRuntimeConfig } from '@sams/shared';

import { OrchestratorModule } from './infrastructure/nestjs/orchestrator.module';

export async function createOrchestratorApp(): Promise<INestApplication> {
  loadSamsRuntimeConfig();

  return NestFactory.create(OrchestratorModule);
}

export async function bootstrap(): Promise<INestApplication> {
  const runtimeConfig = loadSamsRuntimeConfig();
  const app = await createOrchestratorApp();

  await app.listen(runtimeConfig.port);

  return app;
}

if (require.main === module) {
  void bootstrap();
}
