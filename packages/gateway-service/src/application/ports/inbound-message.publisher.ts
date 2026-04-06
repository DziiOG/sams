import type { MessagePrimitives } from '../../domain/message.entity';

export interface InboundMessagePublisher {
  publishInbound: (message: MessagePrimitives) => Promise<void>;
}
