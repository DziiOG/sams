import type { ServiceCapability } from '../../domain/service-capability';

export class ListCapabilitiesUseCase {
  public execute(): ServiceCapability[] {
    return [
      {
        name: 'conversation-memory',
        description: 'Reserved capability entry for future memory orchestration.',
      },
    ];
  }
}
