import nodemailer, { type Transporter } from "nodemailer";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

let transporter: Transporter | null = null;

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = isMailConfigured()
    ? nodemailer.createTransport({
        service: "gmail",
        pool: true,
        maxConnections: 3,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : // Dev fallback: don't send anything, just serialize the message
      nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

export async function sendMail(message: MailMessage, fromName: string) {
  const from = isMailConfigured()
    ? `"${fromName.replace(/"/g, "")}" <${process.env.GMAIL_USER}>`
    : `"${fromName}" <no-reply@localhost>`;

  const info = await getTransporter().sendMail({ from, ...message });

  if (!isMailConfigured()) {
    console.log(`[mailer:dev] To: ${message.to}\n${message.text}\n`);
  }
  return info;
}
