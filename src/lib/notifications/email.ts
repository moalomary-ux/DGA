/**
 * Email helper — يستخدم nodemailer + Hostinger SMTP.
 */
import nodemailer, { type Transporter } from 'nodemailer';

let cached: Transporter | null = null;

function transporter(): Transporter | null {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[email] SMTP not configured — email features disabled');
    return null;
  }
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user, pass },
  });
  return cached;
}

interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<boolean> {
  const t = transporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: opts.from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ''),
    });
    return true;
  } catch (e) {
    console.error('[email] send failed:', e);
    return false;
  }
}

/** قالب رابط دخول OTP */
export function loginLinkHtml(name: string, link: string, tenantNameAr: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;background:#f5f7fa;padding:40px;margin:0;">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#2a206a,#7c32c9);padding:32px;color:#fff;text-align:center;">
      <h1 style="margin:0;font-size:22px;">${tenantNameAr}</h1>
    </td></tr>
    <tr><td style="padding:32px;color:#333;line-height:1.7;">
      <p style="font-size:16px;">السلام عليكم ${name}،</p>
      <p>اضغط على الزر التالي للدخول. الرابط صالح لـ <b>15 دقيقة</b>.</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="${link}" style="background:linear-gradient(135deg,#2a206a,#7c32c9);color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">دخول الآن</a>
      </p>
      <p style="font-size:12px;color:#888;">إن لم تطلب هذا الرابط، تجاهل هذا الإيميل.</p>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:18px;text-align:center;font-size:11px;color:#999;">
      هيئة الحكومة الرقمية · DGA · ${new Date().getFullYear()}
    </td></tr>
  </table>
</body></html>`;
}
