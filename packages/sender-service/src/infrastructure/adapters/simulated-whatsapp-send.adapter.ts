import { Injectable } from '@nestjs/common';

import type {
  DispatchOutboundMessageCommand,
  DispatchOutboundMessageResult,
  OutboundMessageSender,
} from '../../application/ports/outbound-message-sender';

@Injectable()
export class SimulatedWhatsAppSendAdapter implements OutboundMessageSender {
  public async send(
    command: DispatchOutboundMessageCommand,
  ): Promise<DispatchOutboundMessageResult> {
    console.warn(
      `[sender:${command.correlationId}] Simulated WhatsApp delivery to ${command.recipientPhone}: ${command.messageText}`,
    );

    return {
      status: 'sent',
      providerMessageId: `simulated-${command.correlationId}`,
    };
  }
}
