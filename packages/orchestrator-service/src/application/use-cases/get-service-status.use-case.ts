import type { ServiceStatus } from '../../domain/service-status';

export class GetServiceStatusUseCase {
  public execute(): ServiceStatus {
    return {
      service: 'orchestrator-service',
      status: 'ready',
    };
  }
}
