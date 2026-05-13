import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() || '';
  const year = searchParams.get('year');
  const type = searchParams.get('type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000);

  // الموظفون لا يرون البيانات السرية (provider, cost)
  const isAdmin = true; // TODO: check role

  try {
    let rows;
    if (search) {
      const pat = `%${search}%`;
      rows = await db<any[]>`
        SELECT 
          p.id, p.title, p.type, p.year, p.month, p.start_date, p.end_date,
          p.country, p.seats, p.is_high_impact,
          ${isAdmin ? db`p.provider, p.cost_per_seat, p.total_cost, p.project` : db`NULL AS provider, NULL AS cost_per_seat, NULL AS total_cost, NULL AS project`},
          (SELECT COUNT(*) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS actual_beneficiaries,
          (SELECT COUNT(DISTINCT org_id) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS orgs_served
        FROM qtech_programs p
        WHERE p.title ILIKE ${pat}
        ORDER BY p.year DESC NULLS LAST, p.start_date DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (year && type) {
      rows = await db<any[]>`
        SELECT 
          p.id, p.title, p.type, p.year, p.month, p.start_date, p.end_date,
          p.country, p.seats, p.is_high_impact,
          ${isAdmin ? db`p.provider, p.cost_per_seat, p.total_cost, p.project` : db`NULL AS provider, NULL AS cost_per_seat, NULL AS total_cost, NULL AS project`},
          (SELECT COUNT(*) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS actual_beneficiaries,
          (SELECT COUNT(DISTINCT org_id) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS orgs_served
        FROM qtech_programs p
        WHERE p.year = ${parseInt(year, 10)} AND p.type = ${type}
        ORDER BY p.start_date DESC NULLS LAST LIMIT ${limit}
      `;
    } else if (year) {
      rows = await db<any[]>`
        SELECT 
          p.id, p.title, p.type, p.year, p.month, p.start_date, p.end_date,
          p.country, p.seats, p.is_high_impact,
          ${isAdmin ? db`p.provider, p.cost_per_seat, p.total_cost, p.project` : db`NULL AS provider, NULL AS cost_per_seat, NULL AS total_cost, NULL AS project`},
          (SELECT COUNT(*) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS actual_beneficiaries,
          (SELECT COUNT(DISTINCT org_id) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS orgs_served
        FROM qtech_programs p
        WHERE p.year = ${parseInt(year, 10)}
        ORDER BY p.start_date DESC NULLS LAST LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT 
          p.id, p.title, p.type, p.year, p.month, p.start_date, p.end_date,
          p.country, p.seats, p.is_high_impact,
          ${isAdmin ? db`p.provider, p.cost_per_seat, p.total_cost, p.project` : db`NULL AS provider, NULL AS cost_per_seat, NULL AS total_cost, NULL AS project`},
          (SELECT COUNT(*) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS actual_beneficiaries,
          (SELECT COUNT(DISTINCT org_id) FROM qtech_beneficiaries WHERE program_id = p.id)::int AS orgs_served
        FROM qtech_programs p
        ORDER BY p.year DESC NULLS LAST, p.start_date DESC NULLS LAST
        LIMIT ${limit}
      `;
    }

    const years = await db<any[]>`
      SELECT DISTINCT year::int AS year FROM qtech_programs 
      WHERE year IS NOT NULL ORDER BY year DESC
    `;
    const types = await db<any[]>`
      SELECT DISTINCT type FROM qtech_programs WHERE type IS NOT NULL ORDER BY type
    `;

    return NextResponse.json({
      programs: rows,
      filters: {
        years: years.map(y => y.year),
        types: types.map(t => t.type),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
