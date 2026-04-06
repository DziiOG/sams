import { Contact } from './contact.entity';

describe('Contact', () => {
  it('creates a WhatsApp contact with a normalized E.164 phone number', () => {
    const contact = Contact.create({
      phoneNumber: ' +15551234567 ',
      displayName: 'Sam Owner',
    });

    expect(contact.phoneNumber).toBe('+15551234567');
    expect(contact.displayName).toBe('Sam Owner');
  });

  it('rejects an invalid phone number', () => {
    expect(() =>
      Contact.create({
        phoneNumber: '555-1234',
        displayName: 'Sam Owner',
      }),
    ).toThrow('Contact phone number must be in E.164 format');
  });
});
