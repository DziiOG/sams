import { Controller, Get, Inject } from '@nestjs/common';

import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import type { ServiceStatus } from '../../domain/service-status';

@Controller('health')
export class HealthController {
  public constructor(
    @Inject(GetServiceStatusUseCase)
    private readonly getServiceStatusUseCase: GetServiceStatusUseCase,
  ) {}

  @Get()
  public getHealth(): ServiceStatus {
    return this.getServiceStatusUseCase.execute();
  }
}
