// Outgoing mail for account emails (verify, password reset). Zero dependencies — pick one transport by env:
//   RESEND_API_KEY            → https://api.resend.com/emails (PHI_MAIL_FROM required)
//   PHI_MAIL_WEBHOOK (+ _KEY) → POST {to, from, subject, text} as JSON to any relay you run (bearer PHI_MAIL_KEY)
//   none                      → dev outbox: appended to <dataDir>/outbox.jsonl and printed to the console
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

export function mailerFromEnv(env, dataDir, fetchImpl = fetch) {
  const from = env.PHI_MAIL_FROM || 'Phiace <no-reply@localhost>';
  if (env.RESEND_API_KEY) {
    return {
      kind: 'resend', outbox: false,
      send: async ({ to, subject, text }) => {
        const r = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, text }) });
        if (!r.ok) throw new Error('mail ' + r.status);
      },
    };
  }
  if (env.PHI_MAIL_WEBHOOK) {
    return {
      kind: 'webhook', outbox: false,
      send: async (m) => {
        const r = await fetchImpl(env.PHI_MAIL_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json', ...(env.PHI_MAIL_KEY ? { authorization: 'Bearer ' + env.PHI_MAIL_KEY } : {}) }, body: JSON.stringify({ from, ...m }) });
        if (!r.ok) throw new Error('mail ' + r.status);
      },
    };
  }
  const file = join(dataDir, 'outbox.jsonl');
  return {
    kind: 'outbox', outbox: true,
    send: async (m) => {
      appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), from, ...m }) + '\n');
      if (env.PHI_QUIET !== '1') console.log(`[phiora mail → ${m.to}] ${m.subject}\n  ${m.link ?? ''}`);
    },
  };
}

/** The two account emails. `link` lands on the app, which finishes the step through the API. */
export const verifyMail = (to, name, link) => ({ to, link, subject: 'Confirm your email for Phiace',
  text: `Hi ${name},\n\nConfirm this address for your Phiace account:\n${link}\n\nThe link works once and expires in 24 hours. If you didn't ask for this, ignore this email.` });
export const resetMail = (to, name, link) => ({ to, link, subject: 'Reset your Phiace password',
  text: `Hi ${name},\n\nSomeone asked to reset the password for your Phiace account. To choose a new one:\n${link}\n\nThe link works once and expires in 30 minutes. If it wasn't you, ignore this email — your password stays the same.` });
