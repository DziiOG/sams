import { randomUUID } from 'node:crypto';

import { Message } from '../../domain/message.entity';
import type { InboundMessagePublisher } from '../ports/inbound-message.publisher';

export interface ProcessInboundMessageCommand {
  channel: string;
  senderId: string;
  content: string;
  correlationId?: string;
}

export interface ProcessInboundMessageResult {
  status: 'accepted';
  messageId: string;
  correlationId: string;
}

export class ProcessInboundMessageUseCase {
  public constructor(private readonly publisher: InboundMessagePublisher) {}

  public async execute(
    command: ProcessInboundMessageCommand,
  ): Promise<ProcessInboundMessageResult> {
    const message = Message.create({
      ...command,
      correlationId: command.correlationId ?? randomUUID(),
    });

    await this.publisher.publishInbound(message.toPrimitives());

    return {
      status: 'accepted',
      messageId: message.id,
      correlationId: message.correlationId,
    };
  }
}
