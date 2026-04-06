import { randomUUID } from 'node:crypto';

import type { ConfirmChannel } from 'amqplib';

import { declareDurableExchange } from './exchange-declaration.helper';
import type { RabbitMqConnectionManager } from './rabbitmq-connection.manager';
import type { MessagingEnvelope, PublishMessageOptions } from './types';

export class RabbitMqProducer {
  public constructor(private readonly connectionManager: RabbitMqConnectionManager) {}

  public async publish<TPayload>(options: PublishMessageOptions<TPayload>): Promise<void> {
    const channel = await this.connectionManager.createChannel();

    try {
      await declareDurableExchange(channel, options.exchange, options.exchangeType ?? 'direct');

      const envelope = this.createEnvelope(options);
      const buffer = Buffer.from(JSON.stringify(envelope));

      channel.publish(options.exchange, options.routingKey, buffer, {
        persistent: true,
        contentType: 'application/json',
        correlationId: envelope.metadata.correlationId,
        timestamp: Date.parse(envelope.metadata.timestamp),
        headers: options.headers,
      });

      await channel.waitForConfirms();
    } finally {
      await this.closeChannel(channel);
    }
  }

  public async close(): Promise<void> {
    await Promise.resolve();
  }

  private createEnvelope<TPayload>(
    options: PublishMessageOptions<TPayload>,
  ): MessagingEnvelope<TPayload> {
    return {
      payload: options.payload,
      metadata: {
        correlationId: options.correlationId ?? randomUUID(),
        timestamp: options.timestamp ?? new Date().toISOString(),
      },
    };
  }

  private async closeChannel(channel: ConfirmChannel): Promise<void> {
    await channel.close().catch(() => undefined);
  }
}
