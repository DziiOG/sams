import type { DispatchCommand, InboundWhatsAppMessageEvent } from '@sams/shared';

import type { AIProvider } from '../ports/ai-provider';
import type { ApprovalRelay } from '../ports/approval-relay';
import type { DispatchPublisher } from '../ports/dispatch-publisher';
import { OrchestratePipelineUseCase } from './orchestrate-pipeline.use-case';

describe('OrchestratePipelineUseCase', () => {
  it('generates a suggestion, requests approval, and publishes a dispatch command', async () => {
    const aiProvider: AIProvider = {
      generateReply: jest.fn().mockResolvedValue('Suggested response'),
    };
    const approvalRelay: ApprovalRelay = {
      requestApproval: jest.fn().mockResolvedValue({
        status: 'approved',
        approvedBy: '+15551234567',
      }),
    };
    const dispatchPublisher: DispatchPublisher = {
      publishDispatch: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new OrchestratePipelineUseCase(aiProvider, approvalRelay, dispatchPublisher);

    const event: InboundWhatsAppMessageEvent = {
      messageId: 'msg-1',
      externalMessageId: 'wamid.1',
      channel: 'whatsapp',
      senderId: '+15551234567',
      content: 'What is on my schedule?',
      correlationId: 'corr-123',
      receivedAt: new Date().toISOString(),
      contact: {
        phoneNumber: '+15551234567',
        displayName: 'Sam Owner',
      },
      sessionWindow: {
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        isOpen: true,
      },
    };

    const result = await useCase.execute(event);

    expect(dispatchPublisher.publishDispatch).toHaveBeenCalledWith(
      expect.objectContaining<Partial<DispatchCommand>>({
        correlationId: 'corr-123',
        recipientPhone: '+15551234567',
        messageText: 'Suggested response',
      }),
    );
    expect(result.status).toBe('dispatched');
  });
});
