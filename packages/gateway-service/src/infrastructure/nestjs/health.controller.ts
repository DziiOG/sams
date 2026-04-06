import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  public getHealth(): { service: string; status: 'ok' } {
    return {
      service: 'gateway-service',
      status: 'ok',
    };
  }
}
