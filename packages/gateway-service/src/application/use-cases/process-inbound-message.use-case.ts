import { randomUUID } from 'node:crypto';

import type { InboundWhatsAppMessageEvent } from '@sams/shared';

import { Contact } from '../../domain/contact.entity';
import { Message } from '../../domain/message.entity';
import { SessionWindow } from '../../domain/session-window.value-object';
import { SenderNotAllowedError } from '../errors/sender-not-allowed.error';
import type { InboundMessagePublisher } from '../ports/inbound-message.publisher';

export interface ProcessInboundMessageCommand {
  channel: 'whatsapp';
  senderId: string;
  contactName?: string;
  content: string;
  externalMessageId: string;
  correlationId?: string;
  receivedAt?: Date;
}

export interface ProcessInboundMessageResult {
  status: 'accepted';
  messageId: string;
  correlationId: string;
}

export class ProcessInboundMessageUseCase {
  public constructor(
    private readonly publisher: InboundMessagePublisher,
    private readonly ownerPhone: string,
  ) {}

  public async execute(
    command: ProcessInboundMessageCommand,
  ): Promise<ProcessInboundMessageResult> {
    if (command.senderId !== this.ownerPhone) {
      throw new SenderNotAllowedError(command.senderId);
    }

    const receivedAt = command.receivedAt ?? new Date();
    const contact = Contact.create({
      phoneNumber: command.senderId,
      displayName: command.contactName,
    });
    const sessionWindow = SessionWindow.open(receivedAt);
    const message = Message.create({
      channel: command.channel,
      senderId: contact.phoneNumber,
      content: command.content,
      correlationId: command.correlationId ?? randomUUID(),
      receivedAt,
    });

    await this.publisher.publishInbound(this.buildEvent({
      message,
      contact,
      sessionWindow,
      externalMessageId: command.externalMessageId,
      receivedAt,
    }));

    return {
      status: 'accepted',
      messageId: message.id,
      correlationId: message.correlationId,
    };
  }

  private buildEvent(input: {
    message: Message;
    contact: Contact;
    sessionWindow: SessionWindow;
    externalMessageId: string;
    receivedAt: Date;
  }): InboundWhatsAppMessageEvent {
    return {
      messageId: input.message.id,
      externalMessageId: input.externalMessageId,
      channel: 'whatsapp',
      senderId: input.contact.phoneNumber,
      content: input.message.content,
      correlationId: input.message.correlationId,
      receivedAt: input.receivedAt.toISOString(),
      contact: input.contact.toPrimitives(),
      sessionWindow: input.sessionWindow.toPrimitives(input.receivedAt),
    };
  }
}
