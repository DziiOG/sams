import type { ServiceCapability } from '../../domain/service-capability';

export class ListCapabilitiesUseCase {
  public execute(): ServiceCapability[] {
    return [
      {
        name: 'intent-analysis',
        description: 'Reserved capability entry for future AI orchestration.',
      },
    ];
  }
}
