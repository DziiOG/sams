import { Module } from '@nestjs/common';

import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [GetServiceStatusUseCase],
})
export class SenderModule {}
