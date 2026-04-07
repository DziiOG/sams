import type { Result } from '@sams/shared';

export interface DispatchOutboundMessageCommand {
  correlationId: string;
  recipientPhone: string;
  messageText: string;
  channel?: 'whatsapp';
  sourceMessageId?: string;
}

export interface DispatchOutboundMessageResult {
  status: 'sent';
  providerMessageId: string;
}

export interface OutboundMessageSender {
  send: (command: DispatchOutboundMessageCommand) => Promise<Result<DispatchOutboundMessageResult>>;
}
