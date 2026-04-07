import { Result, ResultStatus } from '@sams/shared';

import type { OutboundMessageSender } from '../ports/outbound-message-sender';
import { DispatchOutboundMessageUseCase } from './dispatch-outbound-message.use-case';

describe('DispatchOutboundMessageUseCase', () => {
  it('sends the outbound reply through the configured sender strategy', async () => {
    const sender: OutboundMessageSender = {
      send: jest.fn().mockResolvedValue(
        Result.success({
          status: 'sent',
          providerMessageId: 'provider-123',
        }),
      ),
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
    expect(result.isSuccess).toBe(true);
    expect(result.status).toBe(ResultStatus.Ok);
    expect(result.value).toEqual({
      status: 'sent',
      providerMessageId: 'provider-123',
    });
  });

  it('returns a validation result for invalid outbound input', async () => {
    const sender: OutboundMessageSender = {
      send: jest.fn(),
    };

    const useCase = new DispatchOutboundMessageUseCase(sender);

    const result = await useCase.execute({
      correlationId: '',
      recipientPhone: '+15551234567',
      messageText: 'Approved response',
    });

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(ResultStatus.BadRequest);
    expect(result.error).toContain('Correlation id is required');
    expect(sender.send).not.toHaveBeenCalled();
  });

  it('returns a failed dependency result when the sender strategy throws', async () => {
    const sender: OutboundMessageSender = {
      send: jest.fn().mockResolvedValue(Result.failedDependency('Provider unavailable')),
    };

    const useCase = new DispatchOutboundMessageUseCase(sender);

    const result = await useCase.execute({
      correlationId: 'corr-123',
      recipientPhone: '+15551234567',
      messageText: 'Approved response',
    });

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(ResultStatus.FailedDependency);
    expect(result.error).toContain('Provider unavailable');
  });
});
