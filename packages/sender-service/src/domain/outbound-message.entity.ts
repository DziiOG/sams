export interface CreateOutboundMessageInput {
  correlationId: string;
  recipientPhone: string;
  messageText: string;
  channel?: 'whatsapp';
}

export class OutboundMessage {
  private constructor(
    public readonly correlationId: string,
    public readonly recipientPhone: string,
    public readonly messageText: string,
    public readonly channel: 'whatsapp',
  ) {}

  public static create(command: CreateOutboundMessageInput): OutboundMessage {
    const correlationId = command.correlationId.trim();
    const recipientPhone = command.recipientPhone.trim();
    const messageText = command.messageText.trim();

    if (!correlationId) {
      throw new Error('Correlation id is required for outbound dispatch');
    }

    if (!recipientPhone) {
      throw new Error('Recipient phone is required for outbound dispatch');
    }

    if (!messageText) {
      throw new Error('Outbound message text is required for outbound dispatch');
    }

    return new OutboundMessage(correlationId, recipientPhone, messageText, 'whatsapp');
  }

  public toCommand(): CreateOutboundMessageInput {
    return {
      correlationId: this.correlationId,
      recipientPhone: this.recipientPhone,
      messageText: this.messageText,
      channel: this.channel,
    };
  }
}
