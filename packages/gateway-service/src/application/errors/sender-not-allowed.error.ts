export class SenderNotAllowedError extends Error {
  public constructor(senderId: string) {
    super(`Sender ${senderId} is not on the WhatsApp MVP allowlist`);
    this.name = 'SenderNotAllowedError';
  }
}
