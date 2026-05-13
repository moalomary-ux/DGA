import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { detectTenant } from '@/lib/tenant';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mail';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const host = req.headers.get('host') || 'localhost';
    const tenant = detectTenant(host);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

    const users = await db<{ id: string; status: string; is_active: boolean }[]>`
      SELECT u.id, u.status, u.is_active
      FROM users u
      INNER JOIN memberships m ON m.user_id = u.id
      WHERE u.email = ${email} AND m.tenant_id = ${tenant.id}
      LIMIT 1
    `;

    const okResponse = NextResponse.json({ ok: true, message: 'تم الإرسال' });

    if (users.length === 0 || users[0].status !== 'active' || !users[0].is_active) {
      console.log(`[auth] OTP rejected for: ${email}`);
      return okResponse;
    }

    const user = users[0];
    const code = generateOTP();
    const codeHash = hashOTP(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db`
      INSERT INTO auth_codes (user_id, tenant_id, code_hash, expires_at, ip_address)
      VALUES (${user.id}, ${tenant.id}, ${codeHash}, ${expiresAt}, ${ip})
    `;

    if (!process.env.SMTP_USER) {
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log(`  🔑  OTP لـ ${email}`);
      console.log(`  CODE: ${code}`);
      console.log(`  TENANT: ${tenant.id}`);
      console.log('═══════════════════════════════════════');
      console.log('');
    } else {
      await sendOTPEmail({ to: email, code, tenant });
    }

    await db`
      INSERT INTO audit_log (event, actor_id, tenant_id, ip_address, metadata)
      VALUES ('otp_requested', ${user.id}, ${tenant.id}, ${ip}, ${JSON.stringify({ email })}::jsonb)
    `;

    return okResponse;
  } catch (err) {
    console.error('[auth/request-code]', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
    }
    return NextResponse.json({ error: 'تعذّر إرسال الرمز' }, { status: 500 });
  }
}
