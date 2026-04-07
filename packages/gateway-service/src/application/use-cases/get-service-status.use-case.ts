import { Result } from '@sams/shared';

export interface GatewayServiceStatus {
  service: string;
  status: 'ok';
}

export class GetServiceStatusUseCase {
  public async execute(): Promise<Result<GatewayServiceStatus>> {
    try {
      return Result.success({
        service: 'gateway-service',
        status: 'ok',
      });
    } catch {
      return Result.serverError('Failed to retrieve gateway service status');
    }
  }
}
