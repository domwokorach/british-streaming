import "server-only";

import { authConfig } from "./config";
import { getStore, isMemoryStore } from "./store";

interface Mail { to: string; subject: string; text: string; link?: string; kind: "verify" | "reset" | "password_changed" | "already_registered" }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function html(mail: Mail) {
  const button = mail.link ? `<p><a href="${esc(mail.link)}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;display:inline-block">Continue</a></p><p style="color:#666;font-size:12px">Or paste this link into your browser:<br>${esc(mail.link)}</p>` : "";
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto"><h2>WorldStreaming</h2><p>${esc(mail.text).replace(/\n/g, "<br>")}</p>${button}</div>`;
}

/** Delivery never throws into the caller: a mail outage must not change an auth response (that would leak existence). */
export async function sendMail(mail: Mail): Promise<void> {
  try {
    const store = getStore();
    if (isMemoryStore(store)) {
      store.outbox.push({ to: mail.to, subject: mail.subject, text: mail.text, link: mail.link, kind: mail.kind, at: new Date() });
      return;
    }
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // Local development without a mail provider: print the link so the flow stays testable.
      console.log(JSON.stringify({ level: "warn", message: "mail_not_sent_no_provider", kind: mail.kind, to: mail.to, link: process.env.NODE_ENV === "production" ? undefined : mail.link }));
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM ?? "WorldStreaming <no-reply@localhost>", to: [mail.to], subject: mail.subject, text: mail.link ? `${mail.text}\n\n${mail.link}` : mail.text, html: html(mail) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(JSON.stringify({ level: "error", message: "mail_provider_error", status: res.status, kind: mail.kind }));
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "mail_send_failed", kind: mail.kind, error: error instanceof Error ? error.message : "unknown" }));
  }
}

export const mails = {
  verify: (to: string, name: string, token: string): Mail => ({ kind: "verify", to, subject: "Verify your WorldStreaming email", text: `Hi ${name}, confirm your email address to finish creating your account. This link expires in ${authConfig.verifyTtlHours} hours.`, link: `${authConfig.appUrl}/account/verify-email?token=${encodeURIComponent(token)}` }),
  reset: (to: string, name: string, token: string): Mail => ({ kind: "reset", to, subject: "Reset your WorldStreaming password", text: `Hi ${name}, we received a request to reset your password. The link expires in ${Math.max(1, Math.round(authConfig.resetTtlSeconds / 60))} minutes and works once. If this wasn't you, you can ignore this email.`, link: `${authConfig.appUrl}/account/reset-password?token=${encodeURIComponent(token)}` }),
  passwordChanged: (to: string, name: string): Mail => ({ kind: "password_changed", to, subject: "Your WorldStreaming password was changed", text: `Hi ${name}, your password was just changed and you were signed out everywhere. If this wasn't you, reset your password immediately and contact support.` }),
  alreadyRegistered: (to: string): Mail => ({ kind: "already_registered", to, subject: "Someone tried to register with your email", text: "A sign-up was attempted with this email address, but an account already exists. If it was you, sign in or reset your password. Otherwise you can ignore this message.", link: `${authConfig.appUrl}/account/sign-in` }),
};
