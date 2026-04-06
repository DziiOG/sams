import { randomUUID } from 'node:crypto';

export const SUPPORTED_MESSAGE_CHANNELS = ['sms', 'whatsapp', 'email', 'webchat'] as const;

export type MessageChannel = (typeof SUPPORTED_MESSAGE_CHANNELS)[number];

export interface CreateMessageInput {
  channel: string;
  senderId: string;
  content: string;
  correlationId?: string;
  receivedAt?: Date;
}

export interface MessagePrimitives {
  id: string;
  channel: MessageChannel;
  senderId: string;
  content: string;
  correlationId: string;
  receivedAt: string;
}

export class Message {
  public readonly id: string;
  public readonly channel: MessageChannel;
  public readonly senderId: string;
  public readonly content: string;
  public readonly correlationId: string;
  public readonly receivedAt: Date;

  private constructor(props: MessagePrimitives) {
    this.id = props.id;
    this.channel = props.channel;
    this.senderId = props.senderId;
    this.content = props.content;
    this.correlationId = props.correlationId;
    this.receivedAt = new Date(props.receivedAt);
  }

  public static create(input: CreateMessageInput): Message {
    const channel = this.normalizeChannel(input.channel);
    const senderId = this.assertNonEmpty(input.senderId, 'Sender ID is required');
    const content = this.assertNonEmpty(input.content, 'Message content cannot be empty');

    if (content.length > 4000) {
      throw new Error('Message content cannot exceed 4000 characters');
    }

    const correlationId = input.correlationId?.trim() || randomUUID();
    const receivedAt = input.receivedAt ?? new Date();

    return new Message({
      id: randomUUID(),
      channel,
      senderId,
      content,
      correlationId,
      receivedAt: receivedAt.toISOString(),
    });
  }

  public toPrimitives(): MessagePrimitives {
    return {
      id: this.id,
      channel: this.channel,
      senderId: this.senderId,
      content: this.content,
      correlationId: this.correlationId,
      receivedAt: this.receivedAt.toISOString(),
    };
  }

  private static normalizeChannel(channel: string): MessageChannel {
    const normalizedChannel = channel.trim().toLowerCase();

    if (!SUPPORTED_MESSAGE_CHANNELS.includes(normalizedChannel as MessageChannel)) {
      throw new Error(`Unsupported message channel: ${channel}`);
    }

    return normalizedChannel as MessageChannel;
  }

  private static assertNonEmpty(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }
}
