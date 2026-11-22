import nodemailer from "nodemailer";

/**
 * Optional SMTP. When SMTP_HOST is not set, mail features degrade gracefully:
 * password reset falls back to "contact the shop" (admin resets it in
 * Admin → Users) and email verification is skipped.
 */
export function mailEnabled() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export function siteUrl(req?: { headers: Headers }) {
  const env = process.env.SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req?.headers.get("x-forwarded-host") || req?.headers.get("host") || "localhost:3000";
  const proto = req?.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

let transport: nodemailer.Transporter | null = null;

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  if (!mailEnabled()) return false;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
