import type {
  DispatchCommand,
  InboundWhatsAppMessageEvent,
  ReplySuggestion,
} from '@sams/shared';

import { ContextBundle } from '../../domain/context-bundle.value-object';
import { PolicyEngine } from '../../domain/policy-engine';
import type { AIProvider } from '../ports/ai-provider';
import type { ApprovalRelay } from '../ports/approval-relay';
import type { DispatchPublisher } from '../ports/dispatch-publisher';

export interface OrchestratePipelineResult {
  status: 'dispatched' | 'rejected';
  correlationId: string;
  replySuggestion: ReplySuggestion;
}

export class OrchestratePipelineUseCase {
  public constructor(
    private readonly aiProvider: AIProvider,
    private readonly approvalRelay: ApprovalRelay,
    private readonly dispatchPublisher: DispatchPublisher,
  ) {}

  public async execute(event: InboundWhatsAppMessageEvent): Promise<OrchestratePipelineResult> {
    const context = ContextBundle.create({
      correlationId: event.correlationId,
      senderPhone: event.contact.phoneNumber,
      inboundText: event.content,
      sessionOpen: event.sessionWindow.isOpen,
    });

    const suggestionText = await this.aiProvider.generateReply(context);
    const policyDecision = PolicyEngine.evaluate({
      context,
      suggestion: suggestionText,
    });

    const replySuggestion: ReplySuggestion = {
      messageText: suggestionText,
      requiresApproval: policyDecision.requiresApproval,
      policyReason: policyDecision.reason,
    };

    const approvalResult = await this.approvalRelay.requestApproval({
      correlationId: event.correlationId,
      recipientPhone: event.contact.phoneNumber,
      suggestion: replySuggestion.messageText,
    });

    if (approvalResult.status === 'rejected') {
      return {
        status: 'rejected',
        correlationId: event.correlationId,
        replySuggestion,
      };
    }

    const dispatchCommand: DispatchCommand = {
      correlationId: event.correlationId,
      sourceMessageId: event.messageId,
      recipientPhone: event.contact.phoneNumber,
      messageText: approvalResult.editedReply ?? replySuggestion.messageText,
      channel: 'whatsapp',
      approvedBy: approvalResult.approvedBy,
    };

    await this.dispatchPublisher.publishDispatch(dispatchCommand);

    return {
      status: 'dispatched',
      correlationId: event.correlationId,
      replySuggestion: {
        ...replySuggestion,
        messageText: dispatchCommand.messageText,
      },
    };
  }
}
