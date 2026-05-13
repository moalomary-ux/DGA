import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "";

async function notify(payload: { title: string; message: string; chatId?: string }) {
  if (!BRIDGE_TOKEN) return;
  try {
    await fetch(`${BRIDGE_URL}/v1/notify/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) { console.error("[notify] failed:", e); }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });

  const { id } = await ctx.params;
  const reqId = Number(id);
  if (!Number.isFinite(reqId)) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const action: "approve" | "reject" = body.action;
  const role: string = body.role || "editor";
  const tenants: string[] | undefined = Array.isArray(body.tenants) && body.tenants.length ? body.tenants : undefined;
  const notes: string = body.notes || "";

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, error: "action must be approve|reject" }, { status: 400 });
  }
  if (!["admin", "editor", "viewer"].includes(role) && !(role === "super_admin" && admin.isSuperAdmin)) {
    return NextResponse.json({ ok: false, error: "invalid role" }, { status: 400 });
  }

  // اقرأ الطلب
  const reqRows = await db<any[]>`
    SELECT rr.id, rr.user_id, rr.requested_tenants, rr.requested_role, rr.status,
           u.email, u.name_ar, u.telegram_chat_id
    FROM registration_requests rr LEFT JOIN users u ON u.id = rr.user_id
    WHERE rr.id = ${reqId} LIMIT 1
  `;
  if (!reqRows.length) return NextResponse.json({ ok: false, error: "request not found" }, { status: 404 });
  const r = reqRows[0];
  if (r.status !== "pending") return NextResponse.json({ ok: false, error: `already ${r.status}` }, { status: 409 });

  try {
    if (action === "reject") {
      await db`UPDATE users SET status='rejected'::user_status, is_active=false WHERE id=${r.user_id}::uuid`;
      await db`UPDATE registration_requests SET status='rejected', reviewed_by=${session.userId}::uuid, reviewed_at=NOW(), review_notes=${notes} WHERE id=${reqId}`;
      await db`INSERT INTO audit_log (event, actor_id, metadata) VALUES ('registration_rejected', ${session.userId}::uuid, ${db.json({ request_id: reqId, target: r.email, notes })})`;
      console.log(`[reg] rejected #${reqId} (${r.email}) by ${session.userId}`);
      return NextResponse.json({ ok: true, decision: "rejected" });
    }

    // ── approve ──
    const finalTenants = tenants ?? r.requested_tenants;
    if (!finalTenants?.length) {
      return NextResponse.json({ ok: false, error: "no tenants — اختر قطاع واحد على الأقل" }, { status: 400 });
    }
    
    // التحقق من صلاحية تعيين tenants (admin يقدر فقط على tenants لي عنده صلاحية فيها)
    if (!admin.isSuperAdmin) {
      const unauthorized = finalTenants.filter((t: string) => !admin.tenants.includes(t));
      if (unauthorized.length) {
        return NextResponse.json({ ok: false, error: `ليس لديك صلاحية على: ${unauthorized.join(",")}` }, { status: 403 });
      }
    }

    // 1) تفعيل المستخدم (status enum + is_active boolean — الاثنين)
    await db`UPDATE users SET status='active'::user_status, is_active=true WHERE id=${r.user_id}::uuid`;

    // 2) memberships لكل tenant
    for (const t of finalTenants) {
      await db`
        INSERT INTO memberships (user_id, tenant_id, role, status, granted_by, granted_at)
        VALUES (${r.user_id}::uuid, ${t}, ${role}::user_role, 'active', ${session.userId}::uuid, NOW())
        ON CONFLICT (user_id, tenant_id) DO UPDATE
          SET role=EXCLUDED.role, status='active', granted_by=EXCLUDED.granted_by, granted_at=NOW()
      `;
    }

    // 3) إغلاق الطلب
    await db`UPDATE registration_requests SET status='approved', reviewed_by=${session.userId}::uuid, reviewed_at=NOW(), review_notes=${notes} WHERE id=${reqId}`;

    // 4) audit
    await db`INSERT INTO audit_log (event, actor_id, metadata) VALUES ('registration_approved', ${session.userId}::uuid, ${db.json({ request_id: reqId, target: r.email, role, tenants: finalTenants, notes })})`;

    console.log(`[reg] approved #${reqId} (${r.email}) role=${role} tenants=${finalTenants.join(",")} by ${session.userId}`);

    // 5) Telegram + email (fire-and-forget)
    notify({
      title: "✅ تم اعتماد موظف جديد",
      message: `الاسم: ${r.name_ar}\nالإيميل: ${r.email}\nالدور: ${role}\nالقطاعات: ${finalTenants.join("، ")}`,
    });
    if (r.telegram_chat_id) {
      notify({
        title: "🎉 تم اعتماد حسابك",
        message: `أهلاً ${r.name_ar}\nتم تفعيل حسابك في منصة قدراتك.\nالقطاعات: ${finalTenants.join("، ")}\nسجّل دخول: https://qtech.help/login`,
        chatId: r.telegram_chat_id,
      });
    }

    return NextResponse.json({ ok: true, decision: "approved", role, tenants: finalTenants });
  } catch (e: any) {
    console.error("[reg] approve/reject failed:", e?.message || e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
