import { Injectable } from '@nestjs/common';

import type { ProcessInboundMessageCommand } from '../../application/use-cases/process-inbound-message.use-case';

interface WhatsAppTextMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
}

interface WhatsAppContact {
  wa_id?: string;
  profile?: {
    name?: string;
  };
}

@Injectable()
export class WhatsAppWebhookAdapter {
  public parse(payload: unknown): ProcessInboundMessageCommand {
    if (!payload || typeof payload !== 'object') {
      throw new Error('WhatsApp webhook payload must be an object');
    }

    const entry = this.getFirstArrayItem((payload as { entry?: unknown[] }).entry, 'entry');
    const change = this.getFirstArrayItem((entry as { changes?: unknown[] }).changes, 'changes');
    const value = (change as { value?: unknown }).value;

    if (!value || typeof value !== 'object') {
      throw new Error('WhatsApp webhook payload is missing the change value');
    }

    const contact = this.getFirstArrayItem((value as { contacts?: unknown[] }).contacts, 'contacts') as WhatsAppContact;
    const message = this.getFirstArrayItem((value as { messages?: unknown[] }).messages, 'messages') as WhatsAppTextMessage;

    if (message.type !== 'text' || !message.text?.body) {
      throw new Error('Only text WhatsApp messages are supported in the MVP');
    }

    const senderId = (message.from ?? contact.wa_id ?? '').trim();

    if (!senderId) {
      throw new Error('WhatsApp sender phone number is missing');
    }

    const externalMessageId = message.id?.trim();

    if (!externalMessageId) {
      throw new Error('WhatsApp message id is missing');
    }

    return {
      channel: 'whatsapp',
      senderId,
      contactName: contact.profile?.name,
      content: message.text.body,
      externalMessageId,
      correlationId: externalMessageId,
      receivedAt: this.parseTimestamp(message.timestamp),
    };
  }

  private getFirstArrayItem(values: unknown[] | undefined, fieldName: string): unknown {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`WhatsApp webhook payload is missing ${fieldName}`);
    }

    return values[0];
  }

  private parseTimestamp(timestamp: string | undefined): Date {
    if (!timestamp) {
      return new Date();
    }

    const numericTimestamp = Number(timestamp);

    if (Number.isNaN(numericTimestamp)) {
      return new Date();
    }

    return new Date(numericTimestamp * 1000);
  }
}
