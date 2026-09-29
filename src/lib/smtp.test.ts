import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({ default: { createTransport } }));

const { createSmtpSender, readSmtpConfig } = await import('./smtp');

const env = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_USER: 'martin@example.com',
  SMTP_PASS: 'secret',
};

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue({});
  createTransport.mockClear();
});

describe('readSmtpConfig', () => {
  it('complète le port et le destinataire par défaut', () => {
    expect(readSmtpConfig(env)).toEqual({
      host: 'smtp.gmail.com',
      port: 465,
      user: 'martin@example.com',
      pass: 'secret',
      to: 'martin@example.com',
    });
  });

  it('respecte un port et un destinataire explicites', () => {
    const c = readSmtpConfig({ ...env, SMTP_PORT: '587', CONTACT_TO: 'autre@example.com' });
    expect(c?.port).toBe(587);
    expect(c?.to).toBe('autre@example.com');
  });

  it('renvoie null quand une variable obligatoire manque', () => {
    expect(readSmtpConfig({ ...env, SMTP_PASS: '' })).toBeNull();
    expect(readSmtpConfig({ SMTP_HOST: 'h' })).toBeNull();
  });
});

describe('createSmtpSender', () => {
  it('passe en TLS direct sur le port 465 et en STARTTLS sinon', () => {
    createSmtpSender(readSmtpConfig(env)!);
    expect(createTransport).toHaveBeenLastCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'martin@example.com', pass: 'secret' },
    });

    createSmtpSender(readSmtpConfig({ ...env, SMTP_PORT: '587' })!);
    expect(createTransport).toHaveBeenLastCalledWith(expect.objectContaining({ port: 587, secure: false }));
  });

  it("envoie depuis le compte SMTP, vers le destinataire, en répondant au visiteur", async () => {
    const send = createSmtpSender(readSmtpConfig(env)!);

    await send({ subject: 'Sujet', text: 'Corps', replyTo: '"Ada" <ada@example.com>' });

    expect(sendMail).toHaveBeenCalledWith({
      from: '"Portfolio Martin Info" <martin@example.com>',
      to: 'martin@example.com',
      replyTo: '"Ada" <ada@example.com>',
      subject: 'Sujet',
      text: 'Corps',
    });
  });
});
