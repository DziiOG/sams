import type { ContextBundle } from './context-bundle.value-object';

export interface PolicyDecision {
  status: 'approved-with-review';
  requiresApproval: boolean;
  reason: string;
}

export interface EvaluatePolicyInput {
  context: ContextBundle;
  suggestion: string;
}

export class PolicyEngine {
  public static evaluate(input: EvaluatePolicyInput): PolicyDecision {
    const suggestion = input.suggestion.trim();

    if (!suggestion) {
      throw new Error('Reply suggestion cannot be empty');
    }

    if (!input.context.sessionOpen) {
      return {
        status: 'approved-with-review',
        requiresApproval: true,
        reason: 'The WhatsApp session window is closed and requires operator review.',
      };
    }

    return {
      status: 'approved-with-review',
      requiresApproval: true,
      reason: 'All outbound AI suggestions require owner approval in the Phase 1 MVP.',
    };
  }
}
