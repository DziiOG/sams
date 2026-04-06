const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export interface CreateContactInput {
  phoneNumber: string;
  displayName?: string;
}

export interface ContactPrimitives {
  phoneNumber: string;
  displayName: string;
}

export class Contact {
  public readonly phoneNumber: string;
  public readonly displayName: string;

  private constructor(props: ContactPrimitives) {
    this.phoneNumber = props.phoneNumber;
    this.displayName = props.displayName;
  }

  public static create(input: CreateContactInput): Contact {
    const phoneNumber = input.phoneNumber.trim();

    if (!E164_PHONE_PATTERN.test(phoneNumber)) {
      throw new Error('Contact phone number must be in E.164 format');
    }

    const displayName = input.displayName?.trim() || 'Unknown Contact';

    return new Contact({
      phoneNumber,
      displayName,
    });
  }

  public toPrimitives(): ContactPrimitives {
    return {
      phoneNumber: this.phoneNumber,
      displayName: this.displayName,
    };
  }
}
