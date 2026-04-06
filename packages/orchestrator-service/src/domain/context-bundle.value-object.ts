export interface CreateContextBundleInput {
  correlationId: string;
  senderPhone: string;
  inboundText: string;
  sessionOpen: boolean;
}

export class ContextBundle {
  public readonly correlationId: string;
  public readonly senderPhone: string;
  public readonly inboundText: string;
  public readonly sessionOpen: boolean;

  private constructor(input: CreateContextBundleInput) {
    this.correlationId = input.correlationId;
    this.senderPhone = input.senderPhone;
    this.inboundText = input.inboundText;
    this.sessionOpen = input.sessionOpen;
  }

  public static create(input: CreateContextBundleInput): ContextBundle {
    const correlationId = input.correlationId.trim();
    const senderPhone = input.senderPhone.trim();
    const inboundText = input.inboundText.trim();

    if (!correlationId) {
      throw new Error('Correlation id is required for orchestration context');
    }

    if (!senderPhone) {
      throw new Error('Sender phone is required for orchestration context');
    }

    if (!inboundText) {
      throw new Error('Inbound text is required for orchestration context');
    }

    return new ContextBundle({
      correlationId,
      senderPhone,
      inboundText,
      sessionOpen: input.sessionOpen,
    });
  }
}
