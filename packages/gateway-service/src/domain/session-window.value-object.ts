export interface SessionWindowPrimitives {
  openedAt: string;
  expiresAt: string;
  isOpen: boolean;
}

export class SessionWindow {
  private readonly expiresAt: Date;

  private constructor(private readonly openedAt: Date) {
    this.expiresAt = new Date(openedAt.getTime() + 24 * 60 * 60 * 1000);
  }

  public static open(openedAt: Date): SessionWindow {
    return new SessionWindow(openedAt);
  }

  public isOpenAt(moment: Date): boolean {
    return moment.getTime() <= this.expiresAt.getTime();
  }

  public toPrimitives(now: Date = new Date()): SessionWindowPrimitives {
    return {
      openedAt: this.openedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      isOpen: this.isOpenAt(now),
    };
  }
}
