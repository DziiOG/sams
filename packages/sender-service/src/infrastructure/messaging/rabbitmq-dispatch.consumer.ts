import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import {
  MessagingExchanges,
  MessagingRoutingKeys,
  QueueNames,
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  RabbitMqProducer,
  type DispatchCommand,
} from '@sams/shared';

import { DispatchOutboundMessageUseCase } from '../../application/use-cases/dispatch-outbound-message.use-case';

@Injectable()
export class RabbitMqDispatchConsumer implements OnModuleInit, OnModuleDestroy {
  public constructor(
    @Inject(RabbitMqConsumer) private readonly consumer: RabbitMqConsumer,
    @Inject(RabbitMqProducer) private readonly producer: RabbitMqProducer,
    @Inject(RabbitMqConnectionManager)
    private readonly connectionManager: RabbitMqConnectionManager,
    @Inject(DispatchOutboundMessageUseCase)
    private readonly dispatchOutboundMessageUseCase: DispatchOutboundMessageUseCase,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.consumer.subscribe<DispatchCommand>({
      exchange: MessagingExchanges.sender,
      exchangeType: 'direct',
      queue: QueueNames.senderDispatch,
      routingKey: MessagingRoutingKeys.senderDispatch,
      retryLimit: 2,
      handler: async (message, controls) => {
        try {
          await this.dispatchOutboundMessageUseCase.execute(message.payload);
        } catch (error) {
          if (message.retryCount >= 2) {
            await this.producer.publish({
              exchange: MessagingExchanges.deadLetter,
              exchangeType: 'direct',
              routingKey: MessagingRoutingKeys.senderDispatchFailed,
              payload: {
                reason: error instanceof Error ? error.message : 'Unknown sender failure',
                command: message.payload,
              },
              correlationId: message.metadata.correlationId,
            });
            await controls.nack(false);
            return;
          }

          throw error;
        }
      },
    });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.consumer.close();
    await this.connectionManager.close();
  }
}
