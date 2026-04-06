import { Module } from '@nestjs/common';

import {
  loadSamsRuntimeConfig,
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  RabbitMqProducer,
} from '@sams/shared';

import type { OutboundMessageSender } from '../../application/ports/outbound-message-sender';
import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import { DispatchOutboundMessageUseCase } from '../../application/use-cases/dispatch-outbound-message.use-case';
import { SimulatedWhatsAppSendAdapter } from '../adapters/simulated-whatsapp-send.adapter';
import { WhatsAppSendAdapter } from '../adapters/whatsapp-send.adapter';
import {
  OUTBOUND_MESSAGE_SENDER,
  SENDER_RUNTIME_CONFIG,
  type SenderRuntimeConfig,
} from '../config/sender.tokens';
import { RabbitMqDispatchConsumer } from '../messaging/rabbitmq-dispatch.consumer';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: SENDER_RUNTIME_CONFIG,
      useFactory: (): SenderRuntimeConfig => loadSamsRuntimeConfig(),
    },
    {
      provide: RabbitMqConnectionManager,
      useFactory: (runtimeConfig: SenderRuntimeConfig): RabbitMqConnectionManager =>
        new RabbitMqConnectionManager(runtimeConfig.rabbitMqUrl),
      inject: [SENDER_RUNTIME_CONFIG],
    },
    {
      provide: RabbitMqConsumer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqConsumer =>
        new RabbitMqConsumer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    {
      provide: RabbitMqProducer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqProducer =>
        new RabbitMqProducer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    SimulatedWhatsAppSendAdapter,
    WhatsAppSendAdapter,
    {
      provide: OUTBOUND_MESSAGE_SENDER,
      useFactory: (
        runtimeConfig: SenderRuntimeConfig,
        simulatedAdapter: SimulatedWhatsAppSendAdapter,
        whatsappAdapter: WhatsAppSendAdapter,
      ): OutboundMessageSender =>
        runtimeConfig.whatsappMode === 'cloud' ? whatsappAdapter : simulatedAdapter,
      inject: [SENDER_RUNTIME_CONFIG, SimulatedWhatsAppSendAdapter, WhatsAppSendAdapter],
    },
    {
      provide: DispatchOutboundMessageUseCase,
      useFactory: (sender: OutboundMessageSender): DispatchOutboundMessageUseCase =>
        new DispatchOutboundMessageUseCase(sender),
      inject: [OUTBOUND_MESSAGE_SENDER],
    },
    RabbitMqDispatchConsumer,
    GetServiceStatusUseCase,
  ],
})
export class SenderModule {}
