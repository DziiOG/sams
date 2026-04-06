import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';

import { createGatewayApp } from '@sams/gateway-service/main';
import { createOrchestratorApp } from '@sams/orchestrator-service/main';
import { createSenderApp } from '@sams/sender-service/main';
import {
  MessagingExchanges,
  MessagingRoutingKeys,
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  RabbitMqProducer,
  type DispatchCommand,
  type InboundWhatsAppMessageEvent,
} from '@sams/shared';

interface MockWhatsAppServer {
  readonly url: string;
  waitForDelivery: (timeoutMs?: number) => Promise<string>;
  close: () => Promise<void>;
}

function applyBaseEnv(rabbitUrl: string, overrides: Record<string, string> = {}): void {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.RABBITMQ_URL = rabbitUrl;
  process.env.REDIS_URL = 'redis://localhost:6379/0';
  process.env.DATABASE_URL = 'postgresql://sams:sams@localhost:5432/sams';
  process.env.WHATSAPP_TOKEN = 'phase1-token';
  process.env.WHATSAPP_APP_SECRET = 'phase1-secret';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.OWNER_PHONE = '+15551234567';
  process.env.WHATSAPP_VERIFY_TOKEN = 'verify-phase1';
  process.env.LLM_PROVIDER = 'mock';
  process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
  process.env.WHATSAPP_MODE = 'simulated';
  process.env.APPROVAL_MODE = 'simulated';
  process.env.SIMULATED_APPROVAL_DECISION = 'Y';
  process.env.WHATSAPP_API_BASE_URL = 'https://graph.facebook.com/v18.0';

  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

function buildWebhookPayload(messageText = "Send me today's summary"): Record<string, unknown> {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: '+15551234567', profile: { name: 'Sam Owner' } }],
              messages: [
                {
                  from: '+15551234567',
                  id: 'wamid.inbound.1',
                  timestamp: '1712400000',
                  type: 'text',
                  text: { body: messageText },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function signPayload(payload: unknown, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')}`;
}

function buildInboundEvent(messageText = 'Need my agenda'): InboundWhatsAppMessageEvent {
  return {
    messageId: 'msg-1',
    externalMessageId: 'wamid.inbound.1',
    channel: 'whatsapp',
    senderId: '+15551234567',
    content: messageText,
    correlationId: 'corr-123',
    receivedAt: new Date('2026-04-06T12:00:00.000Z').toISOString(),
    contact: {
      phoneNumber: '+15551234567',
      displayName: 'Sam Owner',
    },
    sessionWindow: {
      openedAt: new Date('2026-04-06T12:00:00.000Z').toISOString(),
      expiresAt: new Date('2026-04-07T12:00:00.000Z').toISOString(),
      isOpen: true,
    },
  };
}

async function startRabbitMq(): Promise<{
  url: string;
  stop: () => Promise<void>;
}> {
  const container = await new GenericContainer('rabbitmq:3.13-management')
    .withExposedPorts(5672)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
    .start();

  return {
    url: `amqp://guest:guest@${container.getHost()}:${container.getMappedPort(5672)}`,
    stop: async (): Promise<void> => {
      await container.stop();
    },
  };
}

async function createMockWhatsAppServer(): Promise<MockWhatsAppServer> {
  const deliveries: string[] = [];
  let resolveDelivery: ((body: string) => void) | undefined;

  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      const requestBody = Buffer.concat(chunks).toString('utf8');
      deliveries.push(requestBody);
      resolveDelivery?.(requestBody);
      resolveDelivery = undefined;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ messages: [{ id: 'wamid.mocked' }] }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}`,
    waitForDelivery: (timeoutMs = 15000): Promise<string> =>
      new Promise((resolve, reject) => {
        const existingDelivery = deliveries.shift();

        if (existingDelivery) {
          resolve(existingDelivery);
          return;
        }

        const timeout = setTimeout(() => {
          resolveDelivery = undefined;
          reject(new Error('Timed out waiting for a mock WhatsApp delivery'));
        }, timeoutMs);

        resolveDelivery = (body: string): void => {
          clearTimeout(timeout);
          resolve(body);
        };
      }),
    close: async (): Promise<void> => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

describe('WhatsApp Phase 1 pipeline', () => {
  let rabbitMq: {
    url: string;
    stop: () => Promise<void>;
  };

  beforeAll(async (): Promise<void> => {
    rabbitMq = await startRabbitMq();
  }, 120000);

  afterAll(async (): Promise<void> => {
    await rabbitMq.stop();
  });

  it('publishes a validated webhook payload to RabbitMQ', async () => {
    applyBaseEnv(rabbitMq.url);

    const gatewayApp = await createGatewayApp();
    const connectionManager = new RabbitMqConnectionManager(rabbitMq.url);
    const consumer = new RabbitMqConsumer(connectionManager);

    await gatewayApp.init();

    try {
      let resolveInboundEvent!: (event: InboundWhatsAppMessageEvent) => void;
      let rejectInboundEvent!: (error: Error) => void;
      const inboundEventPromise = new Promise<InboundWhatsAppMessageEvent>((resolve, reject) => {
        resolveInboundEvent = resolve;
        rejectInboundEvent = reject;
      });

      await consumer.subscribe<InboundWhatsAppMessageEvent>({
        exchange: MessagingExchanges.inbound,
        exchangeType: 'topic',
        queue: 'test.gateway.publish',
        routingKey: MessagingRoutingKeys.inboundWhatsapp,
        retryLimit: 1,
        handler: async (message, controls) => {
          await controls.ack();
          resolveInboundEvent(message.payload);
        },
      }).catch((error: Error) => {
        rejectInboundEvent(error);
      });

      const payload = buildWebhookPayload();
      const response = await request(gatewayApp.getHttpServer())
        .post('/webhook/whatsapp')
        .set('x-hub-signature-256', signPayload(payload, 'phase1-secret'))
        .set('content-type', 'application/json')
        .send(payload);

      const inboundEvent = await inboundEventPromise;

      expect(response.status).toBe(202);
      expect(inboundEvent.channel).toBe('whatsapp');
      expect(inboundEvent.content).toBe("Send me today's summary");
      expect(inboundEvent.contact.phoneNumber).toBe('+15551234567');
    } finally {
      await gatewayApp.close();
      await consumer.close();
      await connectionManager.close();
    }
  }, 90000);

  it('consumes inbound RabbitMQ events in the orchestrator and publishes sender dispatch commands', async () => {
    applyBaseEnv(rabbitMq.url);

    const orchestratorApp = await createOrchestratorApp();
    const publishConnection = new RabbitMqConnectionManager(rabbitMq.url);
    const observeConnection = new RabbitMqConnectionManager(rabbitMq.url);
    const producer = new RabbitMqProducer(publishConnection);
    const consumer = new RabbitMqConsumer(observeConnection);

    await orchestratorApp.init();

    try {
      let resolveDispatch!: (command: DispatchCommand) => void;
      let rejectDispatch!: (error: Error) => void;
      const dispatchPromise = new Promise<DispatchCommand>((resolve, reject) => {
        resolveDispatch = resolve;
        rejectDispatch = reject;
      });

      await consumer.subscribe<DispatchCommand>({
        exchange: MessagingExchanges.sender,
        exchangeType: 'direct',
        queue: 'test.orchestrator.dispatch',
        routingKey: MessagingRoutingKeys.senderDispatch,
        retryLimit: 1,
        handler: async (message, controls) => {
          await controls.ack();
          resolveDispatch(message.payload);
        },
      }).catch((error: Error) => {
        rejectDispatch(error);
      });

      const inboundEvent = buildInboundEvent('Can you summarize my afternoon?');

      await producer.publish({
        exchange: MessagingExchanges.inbound,
        exchangeType: 'topic',
        routingKey: MessagingRoutingKeys.inboundWhatsapp,
        payload: inboundEvent,
        correlationId: inboundEvent.correlationId,
      });

      const dispatchCommand = await dispatchPromise;

      expect(dispatchCommand.recipientPhone).toBe('+15551234567');
      expect(dispatchCommand.messageText).toContain('Simulated AI reply');
      expect(dispatchCommand.approvedBy).toBe('+15551234567');
    } finally {
      await orchestratorApp.close();
      await consumer.close();
      await observeConnection.close();
      await producer.close();
      await publishConnection.close();
    }
  }, 90000);

  it('dispatches sender commands through the mock WhatsApp API', async () => {
    const mockServer = await createMockWhatsAppServer();

    applyBaseEnv(rabbitMq.url, {
      WHATSAPP_MODE: 'cloud',
      WHATSAPP_API_BASE_URL: mockServer.url,
    });

    const senderApp = await createSenderApp();
    const connectionManager = new RabbitMqConnectionManager(rabbitMq.url);
    const producer = new RabbitMqProducer(connectionManager);

    await senderApp.init();

    try {
      await producer.publish({
        exchange: MessagingExchanges.sender,
        exchangeType: 'direct',
        routingKey: MessagingRoutingKeys.senderDispatch,
        payload: {
          correlationId: 'corr-456',
          sourceMessageId: 'msg-2',
          recipientPhone: '+15551234567',
          messageText: 'Approved response from owner',
          channel: 'whatsapp',
          approvedBy: '+15551234567',
        } satisfies DispatchCommand,
        correlationId: 'corr-456',
      });

      const deliveryBody = await mockServer.waitForDelivery();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(deliveryBody).toContain('Approved response from owner');
      expect(deliveryBody).toContain('+15551234567');
      expect(deliveryBody).toContain('messaging_product');
    } finally {
      await senderApp.close();
      await producer.close();
      await connectionManager.close();
      await mockServer.close();
    }
  }, 90000);

  it('accepts a webhook and delivers a reply through the full sender pipeline', async () => {
    const mockServer = await createMockWhatsAppServer();

    applyBaseEnv(rabbitMq.url, {
      WHATSAPP_MODE: 'cloud',
      WHATSAPP_API_BASE_URL: mockServer.url,
    });

    const orchestratorApp = await createOrchestratorApp();
    const senderApp = await createSenderApp();
    const gatewayApp = await createGatewayApp();

    await Promise.all([orchestratorApp.init(), senderApp.init(), gatewayApp.init()]);

    try {
      const payload = buildWebhookPayload();
      const response = await request(gatewayApp.getHttpServer())
        .post('/webhook/whatsapp')
        .set('x-hub-signature-256', signPayload(payload, 'phase1-secret'))
        .set('content-type', 'application/json')
        .send(payload);

      const deliveryBody = await mockServer.waitForDelivery();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(response.status).toBe(202);
      expect(deliveryBody).toContain('Simulated AI reply');
      expect(deliveryBody).toContain('+15551234567');
    } finally {
      await Promise.all([gatewayApp.close(), senderApp.close(), orchestratorApp.close()]);
      await mockServer.close();
    }
  }, 90000);
});
