import { SessionWindow } from './session-window.value-object';

describe('SessionWindow', () => {
  it('opens a 24-hour session window for an inbound WhatsApp message', () => {
    const now = new Date('2026-04-06T12:00:00.000Z');
    const window = SessionWindow.open(now);

    expect(window.isOpenAt(new Date('2026-04-07T11:59:59.000Z'))).toBe(true);
    expect(window.isOpenAt(new Date('2026-04-07T12:00:01.000Z'))).toBe(false);
  });
});
