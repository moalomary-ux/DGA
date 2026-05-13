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

  // المرشحون = الحاضرون فعلاً + بياناتهم الكاملة من ecosystem_contacts
  // org_full = كل أعمدة ecosystem_organizations كـ JSON (دفاعي، حتى لو الأعمدة اختلفت)
  const nominees = await db<any[]>`
    SELECT
      c.mac_kg_id            AS contact_id,
      c.full_name_ar         AS name,
      c.full_name_en         AS name_en,
      c.job_title_ar         AS title,
      c.primary_email        AS email,
      c.phone                AS phone,
      c.department_ar        AS department,
      c.sector_label         AS sector,
      c.organization_ar      AS organization,
      c.organization_short   AS organization_short,
      c.organization_id      AS organization_id,
      c.relationship_to_mohammed AS relationship,
      c.seniority_level      AS seniority,
      c.importance           AS importance,
      c.role_category        AS role_category,
      c.region               AS region,
      COALESCE(to_jsonb(o.*), '{}'::jsonb) AS org_full,
      a.id                   AS attendance_id,
      a.role                 AS attendance_role,
      a.attendance_date      AS attendance_date,
      a.completed            AS completed,
      a.is_excellent         AS is_excellent,
      a.user_rating          AS user_rating,
      a.notes                AS attendance_notes
    FROM ecosystem_attendances a
    JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
    LEFT JOIN ecosystem_organizations o ON o.id = c.organization_id
    WHERE a.program_id = ${programId}
    ORDER BY 
      a.attendance_date DESC NULLS LAST,
      c.seniority_level DESC NULLS LAST,
      c.importance DESC NULLS LAST,
      c.full_name_ar
    LIMIT 1000
  `;

  // ضابط الاتصال لكل organization_id: نأخذ أعلى seniority في نفس الجهة (غير الشخص نفسه)
  const orgIds = [...new Set(nominees.map(n => n.organization_id).filter(Boolean))];
  const liaisons: Record<number, any> = {};
  if (orgIds.length) {
    const liaisonRows = await db<any[]>`
      SELECT DISTINCT ON (organization_id)
        organization_id,
        mac_kg_id, full_name_ar, job_title_ar, primary_email, phone
      FROM ecosystem_contacts
      WHERE organization_id = ANY(${orgIds}::int[])
        AND is_active = true
        AND relationship_to_mohammed IS NOT NULL
        AND relationship_to_mohammed <> ''
      ORDER BY organization_id, seniority_level DESC NULLS LAST, importance DESC NULLS LAST
    `;
    for (const l of liaisonRows) liaisons[l.organization_id] = l;
  }

  // معلومات البرنامج
  const programs = await db<any[]>`
    SELECT id, title_ar, code, kind, status, start_date, end_date, partner
    FROM ecosystem_programs WHERE id = ${programId} LIMIT 1
  `;

  return NextResponse.json({
    ok: true,
    program: programs[0] || null,
    nominees,
    liaisons,
    total: nominees.length,
  });
}
