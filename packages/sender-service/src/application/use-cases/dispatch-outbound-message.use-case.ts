import { Result } from '@sams/shared';

import { OutboundMessage } from '../../domain/outbound-message.entity';
import type {
  DispatchOutboundMessageCommand,
  DispatchOutboundMessageResult,
  OutboundMessageSender,
} from '../ports/outbound-message-sender';

export class DispatchOutboundMessageUseCase {
  public constructor(private readonly sender: OutboundMessageSender) {}

  public async execute(
    command: DispatchOutboundMessageCommand,
  ): Promise<Result<DispatchOutboundMessageResult>> {
    let outboundMessage: OutboundMessage;

    try {
      outboundMessage = OutboundMessage.create(command);
    } catch (error) {
      return Result.validationError(
        error instanceof Error ? error.message : 'Outbound message validation failed',
      );
    }

    try {
      return await this.sender.send(outboundMessage.toCommand());
    } catch (error) {
      return Result.failedDependency(
        error instanceof Error ? error.message : 'Failed to dispatch outbound message',
      );
    }
  }
}
