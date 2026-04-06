import type { OutboundMessageSender } from '../ports/outbound-message-sender';
import { DispatchOutboundMessageUseCase } from './dispatch-outbound-message.use-case';

describe('DispatchOutboundMessageUseCase', () => {
  it('sends the outbound reply through the configured sender strategy', async () => {
    const sender: OutboundMessageSender = {
      send: jest.fn().mockResolvedValue({
        status: 'sent',
        providerMessageId: 'provider-123',
      }),
    };

    const useCase = new DispatchOutboundMessageUseCase(sender);

    const result = await useCase.execute({
      correlationId: 'corr-123',
      recipientPhone: '+15551234567',
      messageText: 'Approved response',
    });

    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-123',
        recipientPhone: '+15551234567',
      }),
    );
    expect(result.status).toBe('sent');
  });
});
