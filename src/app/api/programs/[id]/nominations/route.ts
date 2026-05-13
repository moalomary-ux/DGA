import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const programId = Number(id);
  if (!Number.isFinite(programId)) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

  // البرنامج
  const programs = await db<any[]>`
    SELECT id, title_ar, code, kind, status, partner,
           TO_CHAR(start_date,'YYYY-MM-DD') AS start_date,
           TO_CHAR(end_date,'YYYY-MM-DD') AS end_date
    FROM ecosystem_programs WHERE id=${programId} LIMIT 1
  `;
  if (!programs.length) return NextResponse.json({ ok: false, error: "program not found" }, { status: 404 });

  // المرشحون مع ضابط الاتصال + الإيميل/الهاتف من ecosystem_contacts كـ fallback
  const nominees = await db<any[]>`
    SELECT
      n.id, n.program_id, n.contact_id,
      n.name_ar, n.name_en,
      COALESCE(n.email, c.primary_email) AS email,
      COALESCE(n.phone, c.phone) AS phone,
      COALESCE(n.job_title, c.job_title_ar) AS job_title,
      COALESCE(n.organization_ar, c.organization_ar) AS organization_ar,
      COALESCE(n.organization_id, c.organization_id) AS organization_id,
      n.national_id,
      n.liaison_id, n.liaison_name, n.liaison_email, n.liaison_phone, n.liaison_organization,
      n.status, n.status_reason,
      n.ai_score, n.ai_reasoning, n.previous_attendance_count,
      n.source, n.created_at, n.decided_at,
      du.name_ar AS decided_by_name,
      cu.name_ar AS created_by_name,
      -- عدد مرات الحضور السابق لنفس الشخص (تكرار)
      (SELECT COUNT(*)::int FROM ecosystem_attendances ea 
       WHERE ea.person_id = n.contact_id AND ea.program_id <> n.program_id) AS prior_programs
    FROM program_nominees n
    LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = n.contact_id
    LEFT JOIN users du ON du.id = n.decided_by
    LEFT JOIN users cu ON cu.id = n.created_by
    WHERE n.program_id=${programId}
    ORDER BY 
      CASE n.status 
        WHEN 'submitted' THEN 1 WHEN 'under_review' THEN 2
        WHEN 'waitlist' THEN 3 WHEN 'accepted' THEN 4
        WHEN 'attended' THEN 5 WHEN 'rejected' THEN 6
      END,
      n.created_at DESC
    LIMIT 1000
  `;

  // إحصاءات
  const counts: Record<string, number> = {
    submitted: 0, under_review: 0, waitlist: 0, accepted: 0, attended: 0, rejected: 0
  };
  for (const n of nominees) counts[n.status] = (counts[n.status] || 0) + 1;

  return NextResponse.json({
    ok: true,
    program: programs[0],
    nominees,
    counts,
    total: nominees.length,
  });
}

// POST: إضافة مرشّح يدوياً
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const programId = Number(id);
  if (!Number.isFinite(programId)) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const {
    name_ar, name_en, email, phone, job_title, organization_ar, national_id,
    liaison_name, liaison_email, liaison_phone, liaison_organization,
    status = "submitted", status_reason,
  } = body;

  if (!name_ar?.trim()) return NextResponse.json({ ok: false, error: "الاسم مطلوب" }, { status: 400 });

  try {
    // محاولة ربط بـ ecosystem_contact (لو موجود بنفس الإيميل أو الاسم)
    let contactId: number | null = null;
    if (email) {
      const found = await db<any[]>`SELECT mac_kg_id FROM ecosystem_contacts WHERE primary_email=${email.toLowerCase()} LIMIT 1`;
      if (found.length) contactId = found[0].mac_kg_id;
    }

    const inserted = await db<any[]>`
      INSERT INTO program_nominees
        (program_id, contact_id, name_ar, name_en, email, phone, job_title, organization_ar, national_id,
         liaison_name, liaison_email, liaison_phone, liaison_organization,
         status, status_reason, source, created_by)
      VALUES (${programId}, ${contactId}, ${name_ar}, ${name_en || null}, 
              ${email?.toLowerCase() || null}, ${phone || null}, ${job_title || null}, 
              ${organization_ar || null}, ${national_id || null},
              ${liaison_name || null}, ${liaison_email || null}, ${liaison_phone || null}, ${liaison_organization || null},
              ${status}, ${status_reason || null}, 'manual', ${session.userId}::uuid)
      RETURNING id
    `;
    
    return NextResponse.json({ ok: true, id: inserted[0].id });
  } catch (e: any) {
    if (String(e.message || e).includes("unique") || String(e.message || e).includes("duplicate")) {
      return NextResponse.json({ ok: false, error: "هذا المرشّح مسجّل مسبقاً في البرنامج (نفس الإيميل أو الهوية)" }, { status: 409 });
    }
    console.error("[nominations POST]", e);
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
