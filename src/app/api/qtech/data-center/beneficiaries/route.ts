import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() || '';
  const orgId = searchParams.get('org_id');
  const programId = searchParams.get('program_id');
  const year = searchParams.get('year');
  const targetLevel = searchParams.get('target_level');
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 2000);

  try {
    let rows;
    if (search) {
      const pat = `%${search}%`;
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.name ILIKE ${pat} OR b.email ILIKE ${pat} OR o.name_ar ILIKE ${pat} OR p.title ILIKE ${pat}
        ORDER BY b.year DESC NULLS LAST, b.start_date DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (orgId) {
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.org_id = ${parseInt(orgId, 10)}
        ORDER BY b.year DESC NULLS LAST LIMIT ${limit}
      `;
    } else if (programId) {
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.program_id = ${parseInt(programId, 10)}
        ORDER BY o.name_ar LIMIT ${limit}
      `;
    } else if (year) {
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.year = ${parseInt(year, 10)}
        ORDER BY b.start_date DESC NULLS LAST LIMIT ${limit}
      `;
    } else if (targetLevel) {
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        WHERE b.target_level = ${targetLevel}
        ORDER BY b.year DESC NULLS LAST LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT 
          b.id, b.name, b.job_title, b.email, b.phone, b.gender,
          b.target_level, b.year, b.month, b.country,
          o.name_ar AS org_name, o.sector AS org_sector,
          p.title AS program_title, p.type AS program_type
        FROM qtech_beneficiaries b
        LEFT JOIN qtech_orgs o ON o.id = b.org_id
        LEFT JOIN qtech_programs p ON p.id = b.program_id
        ORDER BY b.year DESC NULLS LAST, b.start_date DESC NULLS LAST
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ beneficiaries: rows, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
