import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';

import {
  ApiResponseFactory,
  type ApiResponseEnvelope,
} from '@sams/shared';

import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import type { ServiceStatus } from '../../domain/service-status';

@Controller('health')
export class HealthController {
  public constructor(
    @Inject(GetServiceStatusUseCase)
    private readonly getServiceStatusUseCase: GetServiceStatusUseCase,
  ) {}

  @Get()
  public async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponseEnvelope<ServiceStatus>> {
    const result = await this.getServiceStatusUseCase.execute();

    return ApiResponseFactory.create(result, response);
  }
}
