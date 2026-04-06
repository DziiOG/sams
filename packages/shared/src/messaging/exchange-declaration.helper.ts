import type { ConfirmChannel } from 'amqplib';

import type { ExchangeType } from './types';

export async function declareDurableExchange(
  channel: ConfirmChannel,
  exchange: string,
  exchangeType: ExchangeType,
): Promise<void> {
  await channel.assertExchange(exchange, exchangeType, { durable: true });
}
