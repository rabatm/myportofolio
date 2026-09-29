import type { APIRoute } from 'astro';
import { handleContactRequest, type ContactSender } from '../../lib/contactHandler';
import { createSmtpSender, readSmtpConfig } from '../../lib/smtp';

export const prerender = false;

let sender: ContactSender | null = null;

function getSender(): ContactSender {
  if (sender) return sender;

  // En dev, Vite charge .env dans import.meta.env ; en production (node
  // standalone), les variables arrivent par process.env au lancement.
  const config = readSmtpConfig({ ...import.meta.env, ...process.env });
  sender = config
    ? createSmtpSender(config)
    : async () => {
        // Remonte en 502 via handleContactRequest, avec ce message dans les logs.
        throw new Error('SMTP non configuré : SMTP_HOST, SMTP_USER et SMTP_PASS sont requis');
      };
  return sender;
}

export const POST: APIRoute = ({ request }) => handleContactRequest(request, getSender());
