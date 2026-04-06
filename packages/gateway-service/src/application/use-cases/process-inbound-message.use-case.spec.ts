import type { InboundMessagePublisher } from '../ports/inbound-message.publisher';
import { ProcessInboundMessageUseCase } from './process-inbound-message.use-case';

describe('ProcessInboundMessageUseCase', () => {
  it('publishes a validated inbound message', async () => {
    const publisher: InboundMessagePublisher = {
      publishInbound: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new ProcessInboundMessageUseCase(publisher);

    const result = await useCase.execute({
      channel: 'sms',
      senderId: 'sender-1',
      content: 'Ping',
      correlationId: 'corr-789',
    });

    expect(publisher.publishInbound).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'sms',
        senderId: 'sender-1',
        content: 'Ping',
        correlationId: 'corr-789',
      }),
    );
    expect(result.status).toBe('accepted');
    expect(result.messageId).toEqual(expect.any(String));
  });
});
