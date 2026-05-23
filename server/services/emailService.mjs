import nodemailer from 'nodemailer';
import { config } from '../config.mjs';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass || !config.smtp.from) {
    throw new Error('SMTP is not configured.');
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  return transporter;
}

export function isEmailServiceConfigured() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from);
}

export async function sendCancellationVerificationCode({ to, customerName, code, expiresInMinutes }) {
  const client = getTransporter();
  const title = 'קוד אימות לבקשת ביטול תור';
  const greeting = customerName?.trim() ? `היי ${customerName},` : 'שלום,';
  const text = `${greeting}

התקבלה בקשה לביטול תור במערכת BARBER.
קוד האימות שלך הוא: ${code}

הקוד תקף ל-${expiresInMinutes} דקות.
אם לא ביקשת לבטל תור, אפשר להתעלם מההודעה הזו.`;

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background:#120d11; color:#f5e8ee; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#211821; border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:28px;">
        <div style="font-size:12px; letter-spacing:0.18em; color:#e3bf97; font-weight:700;">BARBER</div>
        <h1 style="margin:12px 0 8px; font-size:28px;">קוד אימות לביטול תור</h1>
        <p style="margin:0 0 18px; line-height:1.8;">${greeting}<br/>התקבלה בקשה לביטול תור במערכת BARBER.</p>
        <div style="margin:18px 0; padding:18px; text-align:center; background:#2c2130; border-radius:20px; border:1px solid rgba(227,191,151,0.18);">
          <div style="font-size:14px; color:#d4c4cf; margin-bottom:8px;">קוד האימות שלך</div>
          <div style="font-size:34px; font-weight:800; letter-spacing:0.28em; color:#fff5eb;">${code}</div>
        </div>
        <p style="margin:0; line-height:1.8;">הקוד תקף ל-${expiresInMinutes} דקות בלבד.</p>
        <p style="margin:16px 0 0; line-height:1.8; color:#cbbfd2;">אם לא ביקשת לבטל תור, אפשר להתעלם מהמייל הזה.</p>
      </div>
    </div>
  `;

  await client.sendMail({
    from: config.smtp.from,
    to,
    subject: title,
    text,
    html,
  });
}
