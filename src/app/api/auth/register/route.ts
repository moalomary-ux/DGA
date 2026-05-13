import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name_ar, name_en, title_ar, phone, notes, requested_tenants = ["consulting"] } = body;

    if (!email || !email.includes("@")) return NextResponse.json({ ok: false, error: "إيميل غير صالح" }, { status: 400 });

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await db<{ id: string; status: string }[]>`SELECT id, status::text AS status FROM users WHERE email = ${cleanEmail}`;
    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      if (existing[0].status === "active") {
        return NextResponse.json({ ok: false, error: "هذا الإيميل لديه حساب نشط بالفعل" }, { status: 400 });
      }
      // Update existing data
      await db`UPDATE users SET name_ar = COALESCE(${name_ar || null}, name_ar), name_en = COALESCE(${name_en || null}, name_en), title_ar = COALESCE(${title_ar || null}, title_ar), phone = COALESCE(${phone || null}, phone) WHERE id = ${userId}::uuid`;
    } else {
      const inserted = await db<{ id: string }[]>`
        INSERT INTO users (email, name_ar, name_en, title_ar, phone, is_active, status)
        VALUES (${cleanEmail}, ${name_ar || null}, ${name_en || null}, ${title_ar || null}, ${phone || null}, FALSE, 'pending')
        RETURNING id
      `;
      userId = inserted[0].id;
    }

    await db`
      INSERT INTO registration_requests (user_id, requested_role, requested_tenants, status, user_notes)
      VALUES (${userId}::uuid, 'viewer', ${requested_tenants}::text[], 'pending', ${notes || ""})
    `;

    return NextResponse.json({ ok: true, message: "تم التسجيل، حسابك قيد المراجعة من الإدارة" });
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
