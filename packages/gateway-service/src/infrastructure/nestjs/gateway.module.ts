import { Module } from '@nestjs/common';

import { RabbitMqConnectionManager, RabbitMqProducer } from '@sams/shared';

import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';
import { RabbitMqInboundMessagePublisher } from '../messaging/rabbitmq-inbound-message.publisher';
import { HealthController } from './health.controller';
import { WebhookController } from './webhook.controller';

@Module({
  controllers: [HealthController, WebhookController],
  providers: [
    {
      provide: RabbitMqConnectionManager,
      useFactory: (): RabbitMqConnectionManager =>
        new RabbitMqConnectionManager(process.env.RABBITMQ_URL ?? 'amqp://sams:sams@localhost:5672'),
    },
    {
      provide: RabbitMqProducer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqProducer =>
        new RabbitMqProducer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    RabbitMqInboundMessagePublisher,
    {
      provide: ProcessInboundMessageUseCase,
      useFactory: (
        publisher: RabbitMqInboundMessagePublisher,
      ): ProcessInboundMessageUseCase => new ProcessInboundMessageUseCase(publisher),
      inject: [RabbitMqInboundMessagePublisher],
    },
  ],
})
export class GatewayModule {}
