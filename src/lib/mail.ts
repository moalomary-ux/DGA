import nodemailer, { type Transporter } from 'nodemailer';
import type { TenantConfig } from '@/lib/tenant';

/**
 * SMTP عبر Hostinger — per-tenant transporter
 * كل tenant يسجّل دخول بعنوانه ويرسل من نفس العنوان (المطلب الحقيقي لـ Hostinger).
 *   - skills@qtech.help     ← SMTP_PASS_TRAINING
 *   - help@advicedga.cloud  ← SMTP_PASS_CONSULTING
 *   - mohammed@omary.cloud  ← SMTP_PASS  (default)
 */

const transporters: Record<string, Transporter> = {};

function transporterFor(tenant: TenantConfig): Transporter {
  const user = tenant.smtpFrom || process.env.SMTP_USER || '';

  // اختر كلمة السر حسب الدومين
  let pass = process.env.SMTP_PASS;
  if (user.endsWith('@qtech.help')) {
    pass = process.env.SMTP_PASS_TRAINING || pass;
  } else if (user.endsWith('@advicedga.cloud')) {
    pass = process.env.SMTP_PASS_CONSULTING || pass;
  }

  // cache (نفس الـ user → نفس الـ transporter)
  if (transporters[user]) return transporters[user];

  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass },
  });
  transporters[user] = t;
  return t;
}

interface SendOTPOptions {
  to: string;
  code: string;
  tenant: TenantConfig;
}

export async function sendOTPEmail({ to, code, tenant }: SendOTPOptions) {
  const html = renderOTPHtml({ code, tenant });
  return transporterFor(tenant).sendMail({
    from: `"${tenant.nameAr}" <${tenant.smtpFrom}>`,
    to,
    subject: `رمز الدخول إلى ${tenant.nameAr}`,
    html,
    text: `رمز الدخول الخاص بك: ${code}\n\nصالح لمدة 15 دقيقة.\n\nإذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.`,
  });
}

function renderOTPHtml({ code, tenant }: { code: string; tenant: TenantConfig }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8" /><title>رمز الدخول</title></head>
<body style="margin:0;padding:32px;background:#f7f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <div style="background:${tenant.primary};padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:18px;font-weight:600">${tenant.nameAr}</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#1a1a1a;font-size:16px;margin:0 0 12px">مرحباً،</p>
      <p style="color:#4a4a4a;font-size:14px;line-height:1.7;margin:0 0 24px">
        رمز الدخول الخاص بك إلى <strong>${tenant.nameAr}</strong>:
      </p>
      <div style="background:#f4f4f7;border:2px solid ${tenant.primary};border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-family:'SF Mono',Menlo,monospace;font-size:36px;letter-spacing:8px;color:${tenant.primary};font-weight:700">${code}</div>
      </div>
      <p style="color:#7a7a7a;font-size:13px;line-height:1.6;margin:0">
        هذا الرمز <strong>صالح لمدة 15 دقيقة</strong> ويُستخدم مرة واحدة فقط.<br>
        إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.
      </p>
    </div>
    <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px">
      ${tenant.nameAr} — هيئة الحكومة الرقمية
    </div>
  </div>
</body></html>`;
}

interface SendWelcomeOptions {
  to: string;
  nameAr: string;
  tenant: TenantConfig;
  loginUrl: string;
}

export async function sendWelcomeEmail({ to, nameAr, tenant, loginUrl }: SendWelcomeOptions) {
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:32px;background:#f7f7f9;font-family:-apple-system,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="color:${tenant.primary};margin:0 0 16px">مرحباً ${nameAr}،</h1>
    <p style="color:#4a4a4a;line-height:1.7">تم تفعيل حسابك في <strong>${tenant.nameAr}</strong>.</p>
    <p style="margin:24px 0">
      <a href="${loginUrl}" style="background:${tenant.primary};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">ابدأ الدخول</a>
    </p>
  </div>
</body></html>`;

  return transporterFor(tenant).sendMail({
    from: `"${tenant.nameAr}" <${tenant.smtpFrom}>`,
    to,
    subject: `مرحباً بك في ${tenant.nameAr}`,
    html,
  });
}
