import { Injectable } from '@nestjs/common';

import { Result } from '@sams/shared';

import type {
  DispatchOutboundMessageCommand,
  DispatchOutboundMessageResult,
  OutboundMessageSender,
} from '../../application/ports/outbound-message-sender';

@Injectable()
export class SimulatedWhatsAppSendAdapter implements OutboundMessageSender {
  public async send(
    command: DispatchOutboundMessageCommand,
  ): Promise<Result<DispatchOutboundMessageResult>> {
    console.warn(
      `[sender:${command.correlationId}] Simulated WhatsApp delivery to ${command.recipientPhone}: ${command.messageText}`,
    );

    return Result.success({
      status: 'sent',
      providerMessageId: `simulated-${command.correlationId}`,
    });
  }
}
