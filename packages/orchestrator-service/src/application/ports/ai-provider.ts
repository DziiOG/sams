import type { ContextBundle } from '../../domain/context-bundle.value-object';

export interface AIProvider {
  generateReply: (context: ContextBundle) => Promise<string>;
}
