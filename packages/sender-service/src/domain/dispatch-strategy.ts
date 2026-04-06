export type DispatchStrategyMode = 'simulated' | 'whatsapp-cloud';

export class DispatchStrategy {
  public static fromMode(mode: 'simulated' | 'cloud'): DispatchStrategyMode {
    return mode === 'cloud' ? 'whatsapp-cloud' : 'simulated';
  }
}
