import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TABLES: Record<string, { table: string; cols: string[]; searchCols: string[] }> = {
  candidates_status: {
    table: 'ops_candidates_status',
    cols: ['id','name_ar','employer','position_or_about','years_experience','national_id',
           'email','phone','nomination_type','nomination_status','program_name',
           'program_classification','program_type','program_level',
           'program_start','program_end','program_owner'],
    searchCols: ['name_ar','employer','email','program_name','program_owner','national_id'],
  },
  beneficiaries: {
    table: 'ops_beneficiaries',
    cols: ['id','name_ar','employer','national_id','email','phone',
           'program_name','program_type','program_start','program_end'],
    searchCols: ['name_ar','employer','email','program_name','national_id'],
  },
  online_candidates: {
    table: 'ops_online_candidates',
    cols: ['id','name_ar','employer','position_or_about','years_experience',
           'national_id','email','phone','confirmed_attending',
           'program_name','country','program_start','program_end'],
    searchCols: ['name_ar','employer','email','program_name','national_id'],
  },
  withdrawals: {
    table: 'ops_withdrawals',
    cols: ['id','name_ar','employer','national_id','email','phone',
           'program_name','city','program_type','program_start','program_end',
           'withdrawal_date','justification','withdrawal_method'],
    searchCols: ['name_ar','employer','email','program_name','justification'],
  },
  gov_entities: {
    table: 'ops_gov_entities',
    cols: ['id','entity_name'],
    searchCols: ['entity_name'],
  },
  excluded_entities: {
    table: 'ops_excluded_entities',
    cols: ['id','entity_name','responsible_person'],
    searchCols: ['entity_name','responsible_person'],
  },
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dataset = url.searchParams.get('dataset') || 'candidates_status';

  if (dataset === 'stats') {
    const counts = await db<{ tbl: string; cnt: number }[]>`
      SELECT 'candidates_status' tbl, COUNT(*)::int cnt FROM ops_candidates_status
      UNION ALL SELECT 'beneficiaries', COUNT(*)::int FROM ops_beneficiaries
      UNION ALL SELECT 'online_candidates', COUNT(*)::int FROM ops_online_candidates
      UNION ALL SELECT 'withdrawals', COUNT(*)::int FROM ops_withdrawals
      UNION ALL SELECT 'gov_entities', COUNT(*)::int FROM ops_gov_entities
      UNION ALL SELECT 'excluded_entities', COUNT(*)::int FROM ops_excluded_entities
    `;
    const programs = await db<{ cnt: number }[]>`
      SELECT COUNT(DISTINCT program_name)::int cnt FROM (
        SELECT program_name FROM ops_candidates_status WHERE program_name IS NOT NULL
        UNION SELECT program_name FROM ops_beneficiaries WHERE program_name IS NOT NULL
      ) p
    `;
    const employers = await db<{ cnt: number }[]>`
      SELECT COUNT(DISTINCT employer)::int cnt FROM (
        SELECT employer FROM ops_candidates_status WHERE employer IS NOT NULL
        UNION SELECT employer FROM ops_beneficiaries WHERE employer IS NOT NULL
      ) e
    `;
    const lastSync = await db<{ finished_at: Date | null }[]>`
      SELECT finished_at FROM data_sync_log
      WHERE status = 'success' ORDER BY finished_at DESC NULLS LAST LIMIT 1
    `;
    const stats = Object.fromEntries(counts.map(r => [r.tbl, r.cnt]));
    return NextResponse.json({
      ok: true,
      stats: {
        ...stats,
        programs_count: programs[0]?.cnt || 0,
        employers_count: employers[0]?.cnt || 0,
        last_sync: lastSync[0]?.finished_at || null,
      },
    });
  }

  const cfg = TABLES[dataset];
  if (!cfg) return NextResponse.json({ error: 'unknown dataset' }, { status: 400 });

  const q = url.searchParams.get('q')?.trim();
  const program = url.searchParams.get('program')?.trim();
  const employer = url.searchParams.get('employer')?.trim();
  const status = url.searchParams.get('status')?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(10, parseInt(url.searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (q) {
    const conds = cfg.searchCols.map(c => `${c} ILIKE $${i}`).join(' OR ');
    where.push(`(${conds})`); params.push(`%${q}%`); i++;
  }
  if (program && cfg.cols.includes('program_name')) {
    where.push(`program_name = $${i}`); params.push(program); i++;
  }
  if (employer && cfg.cols.includes('employer')) {
    where.push(`employer = $${i}`); params.push(employer); i++;
  }
  if (status && cfg.cols.includes('nomination_status')) {
    where.push(`nomination_status = $${i}`); params.push(status); i++;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const colsSql = cfg.cols.join(', ');

  const totalRow = await db.unsafe<{ cnt: number }[]>(
    `SELECT COUNT(*)::int cnt FROM ${cfg.table} ${whereSql}`, params as never[]
  );
  const total = totalRow[0]?.cnt || 0;
  const data = await db.unsafe<Record<string, unknown>[]>(
    `SELECT ${colsSql} FROM ${cfg.table} ${whereSql} ORDER BY id LIMIT ${limit} OFFSET ${offset}`,
    params as never[]
  );

  let facets: Record<string, string[]> = {};
  if (page === 1) {
    if (cfg.cols.includes('program_name')) {
      const r = await db.unsafe<{ v: string }[]>(
        `SELECT DISTINCT program_name v FROM ${cfg.table} WHERE program_name IS NOT NULL ORDER BY 1 LIMIT 300`
      );
      facets.programs = r.map(x => x.v);
    }
    if (cfg.cols.includes('employer')) {
      const r = await db.unsafe<{ v: string }[]>(
        `SELECT DISTINCT employer v FROM ${cfg.table} WHERE employer IS NOT NULL ORDER BY 1 LIMIT 500`
      );
      facets.employers = r.map(x => x.v);
    }
    if (cfg.cols.includes('nomination_status')) {
      const r = await db.unsafe<{ v: string }[]>(
        `SELECT DISTINCT nomination_status v FROM ${cfg.table} WHERE nomination_status IS NOT NULL ORDER BY 1`
      );
      facets.statuses = r.map(x => x.v);
    }
  }

  return NextResponse.json({
    ok: true, dataset, data, total, page, limit,
    pages: Math.ceil(total / limit), facets,
  });
}
