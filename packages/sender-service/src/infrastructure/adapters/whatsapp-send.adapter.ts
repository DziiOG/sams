import { Inject, Injectable } from '@nestjs/common';

import { Result } from '@sams/shared';

import type {
  DispatchOutboundMessageCommand,
  DispatchOutboundMessageResult,
  OutboundMessageSender,
} from '../../application/ports/outbound-message-sender';
import { SENDER_RUNTIME_CONFIG, type SenderRuntimeConfig } from '../config/sender.tokens';

@Injectable()
export class WhatsAppSendAdapter implements OutboundMessageSender {
  public constructor(
    @Inject(SENDER_RUNTIME_CONFIG)
    private readonly runtimeConfig: SenderRuntimeConfig,
  ) {}

  public async send(
    command: DispatchOutboundMessageCommand,
  ): Promise<Result<DispatchOutboundMessageResult>> {
    if (!this.runtimeConfig.whatsappToken || !this.runtimeConfig.whatsappPhoneNumberId) {
      return Result.failedDependency('WhatsApp Cloud mode requires token and phone number id');
    }

    const targetUrl = `${this.runtimeConfig.whatsappApiBaseUrl.replace(/\/$/, '')}/${this.runtimeConfig.whatsappPhoneNumberId}/messages`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      let response: globalThis.Response;

      try {
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.runtimeConfig.whatsappToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: command.recipientPhone,
            type: 'text',
            text: {
              body: command.messageText,
            },
          }),
        });
      } catch (error) {
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 200));
          continue;
        }

        return Result.failedDependency(
          error instanceof Error ? error.message : 'WhatsApp Cloud API request failed',
        );
      }

      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 200));
        continue;
      }

      if (!response.ok) {
        return Result.failedDependency(
          `WhatsApp Cloud API request failed with status ${response.status}`,
        );
      }

      const responseBody = (await response.json()) as {
        messages?: Array<{ id?: string }>;
      };

      return Result.success({
        status: 'sent',
        providerMessageId:
          responseBody.messages?.[0]?.id ?? `whatsapp-${command.correlationId}-${attempt}`,
      });
    }

    return Result.failedDependency('WhatsApp Cloud API request exhausted its retry budget');
  }
}
