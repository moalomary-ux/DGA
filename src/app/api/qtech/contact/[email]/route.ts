import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();
  const domain = email.split('@')[1] || '';

  try {
    // Stats من qtech_inbound
    const stats = await db<{ total: string; first_seen: string; last_seen: string; display_name: string }[]>`
      SELECT 
        COUNT(*)::text AS total,
        MIN(received_at)::text AS first_seen,
        MAX(received_at)::text AS last_seen,
        MAX(from_name) AS display_name
      FROM qtech_inbound
      WHERE LOWER(from_addr) ILIKE ${'%<' + email + '>%'}
         OR LOWER(from_addr) = ${email}
    `;

    if (!stats[0] || stats[0].total === '0') {
      return NextResponse.json({ contact: null });
    }

    // البرامج المرتبطة
    const programs = await db<{ id: number; title: string; code: string }[]>`
      SELECT DISTINCT ep.id, ep.title_ar AS title, ep.code
      FROM qtech_inbound qi
      JOIN ecosystem_programs ep ON ep.id = qi.program_id
      WHERE (LOWER(qi.from_addr) ILIKE ${'%<' + email + '>%'} OR LOWER(qi.from_addr) = ${email})
        AND qi.program_id IS NOT NULL
      LIMIT 10
    `;

    // آخر مواضيع
    const recentSubjects = await db<{ subject: string }[]>`
      SELECT subject
      FROM qtech_inbound
      WHERE LOWER(from_addr) ILIKE ${'%<' + email + '>%'}
         OR LOWER(from_addr) = ${email}
      ORDER BY received_at DESC
      LIMIT 5
    `;

    // الجهة من domain
    const org = await db<{ id: number; name_ar: string }[]>`
      SELECT id, name_ar 
      FROM ecosystem_organizations
      WHERE metadata->>'domain' = ${domain}
         OR LOWER(name_ar) ILIKE ${'%' + domain.split('.')[0] + '%'}
      LIMIT 1
    `;

    return NextResponse.json({
      contact: {
        email,
        display_name: stats[0].display_name,
        domain,
        org_name: org[0]?.name_ar || null,
        total_messages: parseInt(stats[0].total, 10),
        first_seen: stats[0].first_seen,
        last_seen: stats[0].last_seen,
        programs,
        recent_subjects: recentSubjects.map(r => r.subject),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
