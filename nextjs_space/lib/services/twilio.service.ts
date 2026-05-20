/**
 * Twilio WhatsApp / SMS Servisi
 * WhatsApp sandbox veya production numarası üzerinden mesaj gönderir.
 *
 * Gerekli env vars:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_WHATSAPP_FROM (orn: whatsapp:+14155238886),
 *   TWILIO_SMS_FROM
 */

import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  return twilio(sid, token);
}

/**
 * WhatsApp mesajı gönderir
 */
export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const message = await client.messages.create({
    from,
    to: toFormatted,
    body,
  });
  return message.sid;
}

/**
 * SMS mesajı gönderir
 */
export async function sendSMS(to: string, body: string): Promise<string> {
  const client = getClient();
  const from = process.env.TWILIO_SMS_FROM;
  if (!from) throw new Error('TWILIO_SMS_FROM not set');

  const message = await client.messages.create({ from, to, body });
  return message.sid;
}

/**
 * Twilio webhook imza doğrulaması
 */
export function validateWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  return twilio.validateRequest(token, signature, url, params);
}
