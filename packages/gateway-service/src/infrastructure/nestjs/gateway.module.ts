import { Module } from '@nestjs/common';

import { loadSamsRuntimeConfig, RabbitMqConnectionManager, RabbitMqProducer } from '@sams/shared';

import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';
import { WhatsAppWebhookAdapter } from '../adapters/whatsapp-webhook.adapter';
import { GATEWAY_RUNTIME_CONFIG, type GatewayRuntimeConfig } from '../config/gateway.tokens';
import { WhatsAppHmacGuard } from '../guards/whatsapp-hmac.guard';
import { RabbitMqInboundMessagePublisher } from '../messaging/rabbitmq-inbound-message.publisher';
import { HealthController } from './health.controller';
import { WebhookController } from './webhook.controller';

@Module({
  controllers: [HealthController, WebhookController],
  providers: [
    {
      provide: GATEWAY_RUNTIME_CONFIG,
      useFactory: (): GatewayRuntimeConfig => loadSamsRuntimeConfig(),
    },
    {
      provide: RabbitMqConnectionManager,
      useFactory: (runtimeConfig: GatewayRuntimeConfig): RabbitMqConnectionManager =>
        new RabbitMqConnectionManager(runtimeConfig.rabbitMqUrl),
      inject: [GATEWAY_RUNTIME_CONFIG],
    },
    {
      provide: RabbitMqProducer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqProducer =>
        new RabbitMqProducer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    RabbitMqInboundMessagePublisher,
    GetServiceStatusUseCase,
    WhatsAppWebhookAdapter,
    WhatsAppHmacGuard,
    {
      provide: ProcessInboundMessageUseCase,
      useFactory: (
        publisher: RabbitMqInboundMessagePublisher,
        runtimeConfig: GatewayRuntimeConfig,
      ): ProcessInboundMessageUseCase =>
        new ProcessInboundMessageUseCase(publisher, runtimeConfig.ownerPhone),
      inject: [RabbitMqInboundMessagePublisher, GATEWAY_RUNTIME_CONFIG],
    },
  ],
})
export class GatewayModule {}
