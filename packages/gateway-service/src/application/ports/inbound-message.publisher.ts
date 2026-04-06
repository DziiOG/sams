import type { InboundWhatsAppMessageEvent } from '@sams/shared';

export interface InboundMessagePublisher {
  publishInbound: (event: InboundWhatsAppMessageEvent) => Promise<void>;
}
