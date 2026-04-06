import { Injectable } from '@nestjs/common';

import type { ContextBundle } from '../../domain/context-bundle.value-object';
import type { AIProvider } from '../../application/ports/ai-provider';

@Injectable()
export class MockAIProvider implements AIProvider {
  public async generateReply(context: ContextBundle): Promise<string> {
    return `Simulated AI reply for ${context.senderPhone}: ${context.inboundText}`;
  }
}
