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
  ): Promise<DispatchOutboundMessageResult> {
    const outboundMessage = OutboundMessage.create(command);

    return this.sender.send(outboundMessage.toCommand());
  }
}
