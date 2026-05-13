import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  try {
    const lRows = await db<any[]>`
      SELECT 
        l.*,
        o.name_ar AS org_name,
        o.sector AS org_sector,
        o.classification AS org_classification,
        o.email_domain AS org_domain,
        o.total_quota_seats AS org_quota,
        o.total_beneficiaries_count AS org_beneficiaries,
        o.total_programs_count AS org_programs
      FROM qtech_liaisons l
      LEFT JOIN qtech_orgs o ON o.id = l.org_id
      WHERE l.id = ${id}
      LIMIT 1
    `;

    if (!lRows[0]) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const liaison = lRows[0];

    // البرامج للجهة
    let recentPrograms: any[] = [];
    let recentBeneficiaries: any[] = [];
    if (liaison.org_id) {
      recentPrograms = await db<any[]>`
        SELECT 
          p.id, p.title, p.type, p.year, p.month, p.country,
          COUNT(b.id) AS beneficiaries_count
        FROM qtech_programs p
        INNER JOIN qtech_beneficiaries b ON b.program_id = p.id AND b.org_id = ${liaison.org_id}
        GROUP BY p.id
        ORDER BY p.year DESC NULLS LAST, p.start_date DESC NULLS LAST
        LIMIT 8
      `;

      recentBeneficiaries = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title,
          p.title AS program_title,
          b.year, b.country
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.org_id = ${liaison.org_id}
        ORDER BY b.year DESC, b.start_date DESC NULLS LAST
        LIMIT 10
      `;
    }

    // الإيميلات السابقة
    const recentEmails = await db<any[]>`
      SELECT id, subject, received_at, status, program_id
      FROM qtech_inbound
      WHERE liaison_id = ${id}
      ORDER BY received_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      liaison,
      recent_programs: recentPrograms,
      recent_beneficiaries: recentBeneficiaries,
      recent_emails: recentEmails,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
