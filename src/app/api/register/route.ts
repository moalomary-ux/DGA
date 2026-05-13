import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name_ar, name_en, tenant, notes } = body;
  
  if (!email || !name_ar || !tenant) {
    return NextResponse.json({ ok:false, error:"الإيميل والاسم والمنصة مطلوبة" }, { status:400 });
  }
  
  const emailLower = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ ok:false, error:"إيميل غير صحيح" }, { status:400 });
  }
  
  const tenantRows = await db<{id:string;name_ar:string}[]>`
    SELECT id, name_ar FROM tenants WHERE id = ${tenant} AND allows_registration = TRUE
  `;
  if (tenantRows.length === 0) return NextResponse.json({ ok:false, error:"منصة غير متاحة للتسجيل" }, { status:400 });
  
  const existing = await db<{id:string;status:string}[]>`SELECT id, status FROM users WHERE lower(email) = ${emailLower}`;
  
  let userId: string;
  let isNewUser = false;
  
  if (existing.length > 0) {
    if (existing[0].status === 'active') {
      return NextResponse.json({ ok:false, error:"الإيميل مسجّل مسبقاً. سجّل دخول من /login" }, { status:409 });
    }
    const prior = await db`
      SELECT id FROM registration_requests 
      WHERE user_id = ${existing[0].id}::uuid AND status = 'pending' AND ${tenant} = ANY(requested_tenants)
    `;
    if (prior.length > 0) {
      return NextResponse.json({ ok:false, error:"لديك طلب قيد المراجعة لهذي المنصة" }, { status:409 });
    }
    userId = existing[0].id;
  } else {
    const nameEnClean = String(name_en || "").trim() || null;
    const slugSource = nameEnClean || emailLower.split('@')[0];
    const userRows = await db<{id:string}[]>`
      INSERT INTO users (email, name_ar, name_en, status, vault_slug)
      VALUES (
        ${emailLower}, ${String(name_ar).trim()}, ${nameEnClean},
        'pending'::user_status,
        regexp_replace(lower(${slugSource}), '[^a-z0-9]+', '-', 'g')
      )
      RETURNING id
    `;
    userId = userRows[0].id;
    isNewUser = true;
  }
  
  // إنشاء الطلب
  await db`
    INSERT INTO registration_requests (user_id, requested_role, requested_tenants, user_notes, status)
    VALUES (${userId}::uuid, 'editor'::user_role, ${[tenant]}, ${notes ? String(notes).slice(0, 1000) : null}, 'pending')
  `;
  
  // إخطار Telegram للسوبر أدمن (non-blocking, fire-and-forget)
  const userType = isNewUser ? "تسجيل جديد" : "طلب منصة إضافية";
  fetch(`${BRIDGE_URL}/v1/notify/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
    body: JSON.stringify({
      title: `🔔 ${userType} — ${tenantRows[0].name_ar}`,
      message: `الاسم: ${name_ar}${name_en ? " (" + name_en + ")" : ""}\nالإيميل: ${emailLower}\nالمنصة: ${tenantRows[0].name_ar}${notes ? "\n\nملاحظات:\n" + notes : ""}`,
      link: "https://qtech.help/admin/registrations",
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
  
  return NextResponse.json({ ok:true, tenant_name: tenantRows[0].name_ar });
}
