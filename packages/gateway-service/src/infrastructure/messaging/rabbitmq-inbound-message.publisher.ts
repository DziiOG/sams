import { Inject, Injectable } from '@nestjs/common';

import { RabbitMqProducer } from '@sams/shared';

import type { InboundMessagePublisher } from '../../application/ports/inbound-message.publisher';
import type { MessagePrimitives } from '../../domain/message.entity';

@Injectable()
export class RabbitMqInboundMessagePublisher implements InboundMessagePublisher {
  public constructor(@Inject(RabbitMqProducer) private readonly producer: RabbitMqProducer) {}

  public async publishInbound(message: MessagePrimitives): Promise<void> {
    await this.producer.publish({
      exchange: 'sams.inbound',
      exchangeType: 'direct',
      routingKey: 'message.received',
      payload: message,
      correlationId: message.correlationId,
      timestamp: message.receivedAt,
    });
  }
}
