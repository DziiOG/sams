import { Inject, Injectable } from '@nestjs/common';

import {
  MessagingExchanges,
  MessagingRoutingKeys,
  RabbitMqProducer,
  type DispatchCommand,
} from '@sams/shared';

import type { DispatchPublisher } from '../../application/ports/dispatch-publisher';

@Injectable()
export class RabbitMqDispatchPublisher implements DispatchPublisher {
  public constructor(@Inject(RabbitMqProducer) private readonly producer: RabbitMqProducer) {}

  public async publishDispatch(command: DispatchCommand): Promise<void> {
    await this.producer.publish({
      exchange: MessagingExchanges.sender,
      exchangeType: 'direct',
      routingKey: MessagingRoutingKeys.senderDispatch,
      payload: command,
      correlationId: command.correlationId,
    });
  }
}
