import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });

  const orgRows = await db`
    SELECT * FROM ecosystem_organizations WHERE id = ${id} LIMIT 1
  `;
  if (!orgRows.length) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }
  const org = orgRows[0];

  // People in this org
  const people = await db`
    SELECT 
      mac_kg_id AS id, full_name_ar, full_name_en, primary_email, phone,
      job_title_ar, job_title_en, role_category, relationship_to_mohammed,
      seniority_level, importance, region, gender
    FROM ecosystem_contacts
    WHERE organization_id = ${id}
    ORDER BY 
      CASE WHEN role_category = 'liaison_officer' THEN 1 ELSE 2 END,
      importance DESC NULLS LAST, 
      full_name_ar
  `;

  // Metrics (Qiyas etc)
  const metrics = await db`
    SELECT metric_type, metric_label, numeric_value, text_value, year, source
    FROM ecosystem_org_metrics
    WHERE organization_id = ${id}
    ORDER BY year DESC, metric_type
  `;

  // Programs attended by people in this org
  const programs = await db`
    SELECT 
      p.id, p.title_ar, p.title_en, p.category, p.program_type,
      p.start_date, COUNT(DISTINCT a.person_id)::int AS attendees_from_org
    FROM ecosystem_programs p
    JOIN ecosystem_attendances a ON a.program_id = p.id
    JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
    WHERE c.organization_id = ${id}
    GROUP BY p.id, p.title_ar, p.title_en, p.category, p.program_type, p.start_date
    ORDER BY attendees_from_org DESC, p.start_date DESC NULLS LAST
    LIMIT 50
  `;

  return NextResponse.json({
    ok: true,
    org,
    people,
    metrics,
    programs,
    stats: {
      total_people: people.length,
      liaison_count: people.filter(p => p.role_category === 'liaison_officer').length,
      trainee_count: people.filter(p => p.role_category === 'trainee').length,
      programs_count: programs.length,
    },
  });
}
