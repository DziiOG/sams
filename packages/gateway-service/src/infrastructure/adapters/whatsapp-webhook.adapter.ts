import { Injectable } from '@nestjs/common';

import { Result } from '@sams/shared';

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
  public parse(payload: unknown): Result<ProcessInboundMessageCommand> {
    if (!payload || typeof payload !== 'object') {
      return Result.validationError('WhatsApp webhook payload must be an object');
    }

    const entryResult = this.getFirstArrayItem<{ changes?: unknown[] }>(
      (payload as { entry?: unknown[] }).entry,
      'entry',
    );

    if (entryResult.isFailure) {
      return Result.validationError(entryResult.error ?? 'WhatsApp webhook payload is missing entry');
    }

    const changeResult = this.getFirstArrayItem<{ value?: unknown }>(
      entryResult.value?.changes,
      'changes',
    );

    if (changeResult.isFailure) {
      return Result.validationError(changeResult.error ?? 'WhatsApp webhook payload is missing changes');
    }

    const value = changeResult.value?.value;

    if (!value || typeof value !== 'object') {
      return Result.validationError('WhatsApp webhook payload is missing the change value');
    }

    const contactResult = this.getFirstArrayItem<WhatsAppContact>(
      (value as { contacts?: unknown[] }).contacts,
      'contacts',
    );

    if (contactResult.isFailure) {
      return Result.validationError(contactResult.error ?? 'WhatsApp webhook payload is missing contacts');
    }

    const messageResult = this.getFirstArrayItem<WhatsAppTextMessage>(
      (value as { messages?: unknown[] }).messages,
      'messages',
    );

    if (messageResult.isFailure) {
      return Result.validationError(messageResult.error ?? 'WhatsApp webhook payload is missing messages');
    }

    const contact = contactResult.value;
    const message = messageResult.value;

    if (!contact) {
      return Result.validationError('WhatsApp webhook payload is missing contacts');
    }

    if (!message) {
      return Result.validationError('WhatsApp webhook payload is missing messages');
    }

    if (message.type !== 'text' || !message.text?.body) {
      return Result.validationError('Only text WhatsApp messages are supported in the MVP');
    }

    const senderId = (message.from ?? contact.wa_id ?? '').trim();

    if (!senderId) {
      return Result.validationError('WhatsApp sender phone number is missing');
    }

    const externalMessageId = message.id?.trim();

    if (!externalMessageId) {
      return Result.validationError('WhatsApp message id is missing');
    }

    return Result.success({
      channel: 'whatsapp',
      senderId,
      contactName: contact.profile?.name,
      content: message.text.body,
      externalMessageId,
      correlationId: externalMessageId,
      receivedAt: this.parseTimestamp(message.timestamp),
    });
  }

  private getFirstArrayItem<T>(values: unknown[] | undefined, fieldName: string): Result<T> {
    if (!Array.isArray(values) || values.length === 0) {
      return Result.validationError(`WhatsApp webhook payload is missing ${fieldName}`);
    }

    return Result.success(values[0] as T);
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
