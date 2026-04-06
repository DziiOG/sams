import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';

import { OrchestratorModule } from './infrastructure/nestjs/orchestrator.module';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(OrchestratorModule);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);

  return app;
}

void bootstrap();
