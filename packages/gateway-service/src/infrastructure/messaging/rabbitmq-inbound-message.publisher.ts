import { Inject, Injectable } from '@nestjs/common';

import {
  MessagingExchanges,
  MessagingRoutingKeys,
  RabbitMqProducer,
  type InboundWhatsAppMessageEvent,
} from '@sams/shared';

import type { InboundMessagePublisher } from '../../application/ports/inbound-message.publisher';

@Injectable()
export class RabbitMqInboundMessagePublisher implements InboundMessagePublisher {
  public constructor(@Inject(RabbitMqProducer) private readonly producer: RabbitMqProducer) {}

  public async publishInbound(event: InboundWhatsAppMessageEvent): Promise<void> {
    await this.producer.publish({
      exchange: MessagingExchanges.inbound,
      exchangeType: 'topic',
      routingKey: MessagingRoutingKeys.inboundWhatsapp,
      payload: event,
      correlationId: event.correlationId,
      timestamp: event.receivedAt,
    });
  }
}
