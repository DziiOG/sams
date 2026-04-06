export const MessagingExchanges = {
  inbound: 'sams.inbound',
  sender: 'sams.sender',
  deadLetter: 'sams.dead-letter',
} as const;

export const MessagingRoutingKeys = {
  inboundWhatsapp: 'inbound.whatsapp',
  senderDispatch: 'sender.dispatch',
  senderDispatchFailed: 'sender.dispatch.failed',
} as const;

export const QueueNames = {
  inboundOrchestrator: 'inbound.orchestrator',
  senderDispatch: 'sender.dispatch',
} as const;

export interface ContactSnapshot {
  phoneNumber: string;
  displayName: string;
}

export interface SessionWindowSnapshot {
  openedAt: string;
  expiresAt: string;
  isOpen: boolean;
}

export interface InboundWhatsAppMessageEvent {
  messageId: string;
  externalMessageId: string;
  channel: 'whatsapp';
  senderId: string;
  content: string;
  correlationId: string;
  receivedAt: string;
  contact: ContactSnapshot;
  sessionWindow: SessionWindowSnapshot;
}

export interface ReplySuggestion {
  messageText: string;
  requiresApproval: boolean;
  policyReason: string;
}

export interface DispatchCommand {
  correlationId: string;
  sourceMessageId: string;
  recipientPhone: string;
  messageText: string;
  channel: 'whatsapp';
  approvedBy: string;
}

export interface DispatchResultEvent {
  correlationId: string;
  recipientPhone: string;
  providerMessageId: string;
  status: 'sent';
}
