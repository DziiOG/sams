import type { ConsumeMessage, ConfirmChannel } from 'amqplib';

import { declareDurableExchange } from './exchange-declaration.helper';
import type { RabbitMqConnectionManager } from './rabbitmq-connection.manager';
import type {
  ConsumedMessage,
  ConsumerControls,
  MessagingEnvelope,
  SubscribeOptions,
} from './types';

export class RabbitMqConsumer {
  private readonly channels: ConfirmChannel[] = [];

  public constructor(private readonly connectionManager: RabbitMqConnectionManager) {}

  public async subscribe<TPayload>(options: SubscribeOptions<TPayload>): Promise<void> {
    const channel = await this.connectionManager.createChannel();
    this.channels.push(channel);

    await declareDurableExchange(channel, options.exchange, options.exchangeType ?? 'direct');
    await channel.prefetch(options.prefetch ?? 1);

    const assertedQueue = await channel.assertQueue(options.queue, {
      durable: options.queueOptions?.durable ?? true,
      autoDelete: options.queueOptions?.autoDelete ?? false,
      exclusive: options.queueOptions?.exclusive ?? false,
    });

    await channel.bindQueue(assertedQueue.queue, options.exchange, options.routingKey);

    await channel.consume(
      assertedQueue.queue,
      async (delivery) => {
        if (!delivery) {
          return;
        }

        await this.handleDelivery(channel, delivery, options);
      },
      { noAck: false },
    );
  }

  public async close(): Promise<void> {
    await Promise.all(this.channels.map(async (channel) => channel.close().catch(() => undefined)));
    this.channels.length = 0;
  }

  private async handleDelivery<TPayload>(
    channel: ConfirmChannel,
    delivery: ConsumeMessage,
    options: SubscribeOptions<TPayload>,
  ): Promise<void> {
    const currentRetryCount = Number(delivery.properties.headers?.['x-retry-count'] ?? 0);
    const parsed = this.parseMessage<TPayload>(delivery);
    let settled = false;

    const controls: ConsumerControls = {
      ack: async (): Promise<void> => {
        if (settled) {
          return;
        }

        try {
          channel.ack(delivery);
        } catch {
          // ignore shutdown races while closing channels
        } finally {
          settled = true;
        }
      },
      nack: async (requeue = false): Promise<void> => {
        if (settled) {
          return;
        }

        try {
          channel.nack(delivery, false, requeue);
        } catch {
          // ignore shutdown races while closing channels
        } finally {
          settled = true;
        }
      },
      retry: async (): Promise<void> => {
        if (settled) {
          return;
        }

        if (currentRetryCount >= (options.retryLimit ?? 3)) {
          channel.nack(delivery, false, false);
          settled = true;
          return;
        }

        try {
          channel.publish(options.exchange, options.routingKey, Buffer.from(JSON.stringify(parsed)), {
            persistent: true,
            contentType: 'application/json',
            correlationId: parsed.metadata.correlationId,
            timestamp: Date.parse(parsed.metadata.timestamp),
            headers: {
              ...(delivery.properties.headers ?? {}),
              'x-retry-count': currentRetryCount + 1,
            },
          });
          await channel.waitForConfirms();
          channel.ack(delivery);
        } catch {
          try {
            channel.nack(delivery, false, false);
          } catch {
            // ignore shutdown races while closing channels
          }
        } finally {
          settled = true;
        }
      },
    };

    try {
      await options.handler(parsed, controls);

      if (!settled) {
        await controls.ack();
      }
    } catch {
      if (!settled) {
        await controls.retry();
      }
    }
  }

  private parseMessage<TPayload>(delivery: ConsumeMessage): ConsumedMessage<TPayload> {
    const parsed = JSON.parse(delivery.content.toString()) as MessagingEnvelope<TPayload>;

    return {
      payload: parsed.payload,
      metadata: parsed.metadata,
      deliveryTag: delivery.fields.deliveryTag,
      retryCount: Number(delivery.properties.headers?.['x-retry-count'] ?? 0),
      headers: (delivery.properties.headers ?? {}) as Record<string, unknown>,
    };
  }
}
