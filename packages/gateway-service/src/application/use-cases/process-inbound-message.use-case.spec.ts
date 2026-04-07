import { ResultStatus } from '@sams/shared';

import type { InboundMessagePublisher } from '../ports/inbound-message.publisher';
import { ProcessInboundMessageUseCase } from './process-inbound-message.use-case';

describe('ProcessInboundMessageUseCase', () => {
  it('publishes a validated inbound WhatsApp message event', async () => {
    const publisher: InboundMessagePublisher = {
      publishInbound: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new ProcessInboundMessageUseCase(publisher, '+15551234567');

    const result = await useCase.execute({
      channel: 'whatsapp',
      senderId: '+15551234567',
      contactName: 'Sam Owner',
      content: 'Ping',
      externalMessageId: 'wamid.123',
      correlationId: 'corr-789',
    });

    expect(publisher.publishInbound).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'whatsapp',
        senderId: '+15551234567',
        content: 'Ping',
        correlationId: 'corr-789',
        contact: expect.objectContaining({
          phoneNumber: '+15551234567',
          displayName: 'Sam Owner',
        }),
        sessionWindow: expect.objectContaining({
          isOpen: true,
        }),
      }),
    );
    expect(result.isSuccess).toBe(true);
    expect(result.status).toBe(ResultStatus.Accepted);
    expect(result.value).toMatchObject({
      status: 'accepted',
      messageId: expect.any(String),
      correlationId: 'corr-789',
    });
  });

  it('rejects senders outside the owner allowlist', async () => {
    const publisher: InboundMessagePublisher = {
      publishInbound: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new ProcessInboundMessageUseCase(publisher, '+15551234567');

    const result = await useCase.execute({
      channel: 'whatsapp',
      senderId: '+15550000000',
      content: 'Ping',
      externalMessageId: 'wamid.456',
    });

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(ResultStatus.Forbidden);
    expect(result.error).toContain('+15550000000');
    expect(publisher.publishInbound).not.toHaveBeenCalled();
  });
});
