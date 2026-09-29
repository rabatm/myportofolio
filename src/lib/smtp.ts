import nodemailer from 'nodemailer';
import type { ContactSender } from './contactHandler';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** Destinataire des messages de contact. */
  to: string;
}

/** Lit la configuration SMTP ; null si une variable obligatoire manque. */
export function readSmtpConfig(env: Record<string, string | undefined>): SmtpConfig | null {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return {
    host: SMTP_HOST,
    port: Number(env.SMTP_PORT) || 465,
    user: SMTP_USER,
    pass: SMTP_PASS,
    to: env.CONTACT_TO || SMTP_USER,
  };
}

/**
 * Expéditeur SMTP. Le mail part du compte SMTP lui-même (Gmail refuse un
 * autre expéditeur), et « Répondre » écrit au visiteur grâce au Reply-To.
 */
export function createSmtpSender(config: SmtpConfig): ContactSender {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 : TLS dès la connexion ; 587 et autres : STARTTLS.
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  return async (mail) => {
    await transport.sendMail({
      from: `"Portfolio Martin Info" <${config.user}>`,
      to: config.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
    });
  };
}
