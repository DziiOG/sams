import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';

import { SenderModule } from './infrastructure/nestjs/sender.module';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(SenderModule);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);

  return app;
}

void bootstrap();
