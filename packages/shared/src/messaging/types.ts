export type ExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';

export interface QueueOptions {
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
}

export interface MessageMetadata {
  correlationId: string;
  timestamp: string;
}

export interface MessagingEnvelope<TPayload> {
  payload: TPayload;
  metadata: MessageMetadata;
}

export interface PublishMessageOptions<TPayload> {
  exchange: string;
  exchangeType?: ExchangeType;
  routingKey: string;
  payload: TPayload;
  correlationId?: string;
  timestamp?: string;
  headers?: Record<string, unknown>;
}

export interface ConsumedMessage<TPayload> extends MessagingEnvelope<TPayload> {
  deliveryTag: number;
}

export interface ConsumerControls {
  ack: () => Promise<void>;
  nack: (requeue?: boolean) => Promise<void>;
  retry: () => Promise<void>;
}

export interface SubscribeOptions<TPayload> {
  exchange: string;
  exchangeType?: ExchangeType;
  queue: string;
  routingKey: string;
  prefetch?: number;
  retryLimit?: number;
  queueOptions?: QueueOptions;
  handler: (message: ConsumedMessage<TPayload>, controls: ConsumerControls) => Promise<void>;
}
