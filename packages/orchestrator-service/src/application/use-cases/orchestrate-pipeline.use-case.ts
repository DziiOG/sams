import {
  Result,
  type DispatchCommand,
  type InboundWhatsAppMessageEvent,
  type ReplySuggestion,
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

  public async execute(
    event: InboundWhatsAppMessageEvent,
  ): Promise<Result<OrchestratePipelineResult>> {
    let context: ContextBundle;

    try {
      context = ContextBundle.create({
        correlationId: event.correlationId,
        senderPhone: event.contact.phoneNumber,
        inboundText: event.content,
        sessionOpen: event.sessionWindow.isOpen,
      });
    } catch (error) {
      return Result.validationError(
        error instanceof Error ? error.message : 'Invalid inbound orchestration event',
      );
    }

    try {
      const suggestionText = await this.aiProvider.generateReply(context);
      let policyDecision: ReturnType<typeof PolicyEngine.evaluate>;

      try {
        policyDecision = PolicyEngine.evaluate({
          context,
          suggestion: suggestionText,
        });
      } catch (error) {
        return Result.validationError(
          error instanceof Error ? error.message : 'Failed policy validation',
        );
      }

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
        return Result.success({
          status: 'rejected',
          correlationId: event.correlationId,
          replySuggestion,
        });
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

      return Result.success({
        status: 'dispatched',
        correlationId: event.correlationId,
        replySuggestion: {
          ...replySuggestion,
          messageText: dispatchCommand.messageText,
        },
      });
    } catch (error) {
      return Result.serverError(
        error instanceof Error ? error.message : 'Failed to orchestrate inbound message',
      );
    }
  }
}
