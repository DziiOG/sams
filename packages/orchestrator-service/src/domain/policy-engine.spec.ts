import { ContextBundle } from './context-bundle.value-object';
import { PolicyEngine } from './policy-engine';

describe('PolicyEngine', () => {
  it('requires owner approval for AI-generated replies in the MVP', () => {
    const context = ContextBundle.create({
      correlationId: 'corr-123',
      senderPhone: '+15551234567',
      inboundText: 'Can you remind me about my calendar?',
      sessionOpen: true,
    });

    const decision = PolicyEngine.evaluate({
      context,
      suggestion: 'You have two calendar events today.',
    });

    expect(decision.status).toBe('approved-with-review');
    expect(decision.requiresApproval).toBe(true);
  });
});
