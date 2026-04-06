import { Message } from './message.entity';

describe('Message', () => {
  it('creates a valid inbound message', () => {
    const message = Message.create({
      channel: 'whatsapp',
      senderId: 'user-123',
      content: 'Hello from SAMS',
      correlationId: 'corr-123',
    });

    expect(message.channel).toBe('whatsapp');
    expect(message.content).toBe('Hello from SAMS');
    expect(message.toPrimitives().correlationId).toBe('corr-123');
  });

  it('rejects empty content', () => {
    expect(() =>
      Message.create({
        channel: 'whatsapp',
        senderId: 'user-123',
        content: '   ',
      }),
    ).toThrow('Message content cannot be empty');
  });
});
