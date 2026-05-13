import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, type User, type Role, type TenantId } from '@/lib/db';
import { detectTenant } from '@/lib/tenant';
import { hashOTP } from '@/lib/otp';
import { createSession } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = schema.parse(body);

    const host = req.headers.get('host') || 'localhost';
    const tenant = detectTenant(host);
    const codeHash = hashOTP(code);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

    // 1. جلب المستخدم
    const users = await db<User[]>`
      SELECT * FROM users WHERE email = ${email} AND status = 'active' AND is_active = true LIMIT 1
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 401 });
    }
    const user = users[0];

    // 2. البحث عن رمز صالح
    const codes = await db<{ id: string; expires_at: Date }[]>`
      SELECT id, expires_at FROM auth_codes
      WHERE user_id = ${user.id}
        AND tenant_id = ${tenant.id}
        AND code_hash = ${codeHash}
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (codes.length === 0) {
      // تسجيل المحاولة الفاشلة
      await db`
        INSERT INTO audit_log (event, actor_id, tenant_id, ip_address, metadata)
        VALUES ('otp_failed', ${user.id}, ${tenant.id}, ${ip}, ${JSON.stringify({ email })}::jsonb)
      `;
      return NextResponse.json({ error: 'الرمز غير صحيح أو منتهي' }, { status: 401 });
    }

    // 3. تعليم الرمز مُستخدم
    await db`UPDATE auth_codes SET used_at = NOW() WHERE id = ${codes[0].id}`;

    // 4. جلب الـ memberships
    const memberships = await db<{ tenant_id: TenantId; role: Role }[]>`
      SELECT tenant_id, role FROM memberships WHERE user_id = ${user.id}
    `;

    // 5. تحديث آخر دخول
    await db`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    // 6. إنشاء الجلسة
    await createSession(
      user,
      memberships.map((m) => ({ tenant: m.tenant_id, role: m.role }))
    );

    // 7. تسجيل
    await db`
      INSERT INTO audit_log (event, actor_id, tenant_id, ip_address)
      VALUES ('login_success', ${user.id}, ${tenant.id}, ${ip})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth/verify-code]', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }
    return NextResponse.json({ error: 'تعذّر التحقّق' }, { status: 500 });
  }
}
