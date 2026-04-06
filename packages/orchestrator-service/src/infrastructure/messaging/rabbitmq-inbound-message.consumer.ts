import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import {
  MessagingExchanges,
  MessagingRoutingKeys,
  QueueNames,
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  type InboundWhatsAppMessageEvent,
} from '@sams/shared';

import { OrchestratePipelineUseCase } from '../../application/use-cases/orchestrate-pipeline.use-case';

@Injectable()
export class RabbitMqInboundMessageConsumer implements OnModuleInit, OnModuleDestroy {
  public constructor(
    @Inject(RabbitMqConsumer) private readonly consumer: RabbitMqConsumer,
    @Inject(RabbitMqConnectionManager)
    private readonly connectionManager: RabbitMqConnectionManager,
    @Inject(OrchestratePipelineUseCase)
    private readonly orchestratePipelineUseCase: OrchestratePipelineUseCase,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.consumer.subscribe<InboundWhatsAppMessageEvent>({
      exchange: MessagingExchanges.inbound,
      exchangeType: 'topic',
      queue: QueueNames.inboundOrchestrator,
      routingKey: MessagingRoutingKeys.inboundWhatsapp,
      retryLimit: 2,
      handler: async (message) => {
        await this.orchestratePipelineUseCase.execute(message.payload);
      },
    });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.consumer.close();
    await this.connectionManager.close();
  }
}
