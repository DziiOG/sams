import { Result } from '@sams/shared';

import type { ServiceStatus } from '../../domain/service-status';

export class GetServiceStatusUseCase {
  public async execute(): Promise<Result<ServiceStatus>> {
    try {
      return Result.success({
        service: 'orchestrator-service',
        status: 'ready',
      });
    } catch {
      return Result.serverError('Failed to retrieve orchestrator service status');
    }
  }
}
