import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

let transporter = null;

if (missingVars.length === 0) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const isEmailConfigured = () => transporter !== null;

export const sendApplicantEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!isEmailConfigured()) {
    throw new Error(
      `SMTP credentials are not configured. Missing: ${missingVars.join(', ')}`
    );
  }

  const fromName =
    process.env.SMTP_FROM_NAME && process.env.SMTP_FROM_NAME.trim().length
      ? process.env.SMTP_FROM_NAME.trim()
      : 'Recruitment Team';

  const fromEmail = process.env.SMTP_FROM_EMAIL;

  const message = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: text || html?.replace(/<[^>]*>/g, ' ') || '',
    html: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
  };

  if (attachments && attachments.length) {
    message.attachments = attachments;
  }

  return transporter.sendMail(message);
};
