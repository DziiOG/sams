import { GenericContainer, Wait } from 'testcontainers';

import {
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  RabbitMqProducer,
  type ConsumedMessage,
} from '@sams/shared';

describe('RabbitMQ publish/consume integration', () => {
  it('publishes and consumes a persistent message with metadata', async () => {
    const container = await new GenericContainer('rabbitmq:3.13-management')
      .withExposedPorts(5672)
      .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
      .start();

    const connectionManager = new RabbitMqConnectionManager(
      `amqp://guest:guest@${container.getHost()}:${container.getMappedPort(5672)}`,
    );
    const producer = new RabbitMqProducer(connectionManager);
    const consumer = new RabbitMqConsumer(connectionManager);

    try {
      let resolveMessage!: (message: ConsumedMessage<{ text: string }>) => void;
      let rejectMessage!: (error: Error) => void;

      const receivedPromise = new Promise<ConsumedMessage<{ text: string }>>((resolve, reject) => {
        resolveMessage = resolve;
        rejectMessage = reject;
      });

      await consumer.subscribe<{ text: string }>({
        exchange: 'sams.inbound',
        exchangeType: 'direct',
        queue: 'sams.integration.queue',
        routingKey: 'message.received',
        retryLimit: 1,
        handler: async (message, controls) => {
          await controls.ack();
          resolveMessage(message);
        },
      });

      await producer.publish({
        exchange: 'sams.inbound',
        exchangeType: 'direct',
        routingKey: 'message.received',
        payload: { text: 'hello integration' },
        correlationId: 'integration-corr-id',
      });

      const received = await Promise.race([
        receivedPromise,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timed out waiting for consumed message')), 20000);
        }),
      ]).catch((error: Error) => {
        rejectMessage(error);
        throw error;
      });

      expect(received.payload.text).toBe('hello integration');
      expect(received.metadata.correlationId).toBe('integration-corr-id');
      expect(received.metadata.timestamp).toBeTruthy();
    } finally {
      await consumer.close();
      await producer.close();
      await connectionManager.close();
      await container.stop();
    }
  });
});
