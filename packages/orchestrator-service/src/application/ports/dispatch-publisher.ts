import type { DispatchCommand } from '@sams/shared';

export interface DispatchPublisher {
  publishDispatch: (command: DispatchCommand) => Promise<void>;
}
