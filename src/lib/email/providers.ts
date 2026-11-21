/**
 * Swappable email delivery. Pick a provider with EMAIL_PROVIDER:
 *   resend   — https://resend.com (default; RESEND_API_KEY)
 *   postmark — https://postmarkapp.com (POSTMARK_SERVER_TOKEN)
 *   webhook  — POST JSON to FORM_WEBHOOK_URL (Zapier, Make, n8n, Slack, your CRM…)
 *   console  — log only (local development)
 * All providers use plain fetch — no SDK dependencies in the serverless bundle.
 */
export type Attachment = { filename: string; content: string /* base64 */; contentType: string };
export type Mail = { to: string; from: string; replyTo?: string; subject: string; text: string; html: string; attachments?: Attachment[]; meta?: Record<string, unknown> };

type Env = Record<string, string | undefined>;

export async function sendMail(mail: Mail, env: Env): Promise<void> {
  const provider = (env.EMAIL_PROVIDER || 'resend').toLowerCase();
  switch (provider) {
    case 'resend': {
      if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html,
          attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, content_type: a.contentType })),
        }),
      });
      if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
      return;
    }
    case 'postmark': {
      if (!env.POSTMARK_SERVER_TOKEN) throw new Error('POSTMARK_SERVER_TOKEN is not set');
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: { 'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          From: mail.from, To: mail.to, ReplyTo: mail.replyTo, Subject: mail.subject, TextBody: mail.text, HtmlBody: mail.html, MessageStream: 'outbound',
          Attachments: mail.attachments?.map((a) => ({ Name: a.filename, Content: a.content, ContentType: a.contentType })),
        }),
      });
      if (!res.ok) throw new Error(`Postmark error ${res.status}: ${await res.text()}`);
      return;
    }
    case 'webhook': {
      if (!env.FORM_WEBHOOK_URL) throw new Error('FORM_WEBHOOK_URL is not set');
      const res = await fetch(env.FORM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(env.FORM_WEBHOOK_SECRET ? { 'X-Webhook-Secret': env.FORM_WEBHOOK_SECRET } : {}) },
        body: JSON.stringify({ subject: mail.subject, replyTo: mail.replyTo, text: mail.text, meta: mail.meta, attachments: mail.attachments?.map((a) => a.filename) }),
      });
      if (!res.ok) throw new Error(`Webhook error ${res.status}`);
      return;
    }
    case 'console': {
      console.info('[forms] email (console provider)\n', { ...mail, html: undefined, attachments: mail.attachments?.map((a) => a.filename) });
      return;
    }
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${provider}"`);
  }
}
