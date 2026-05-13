import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SHEET_TO_TABLE: Record<string, { table: string; cols: string[] }> = {
  excluded_entities: {
    table: 'ops_excluded_entities',
    cols: ['entity_name', 'responsible_person'],
  },
  online_candidates: {
    table: 'ops_online_candidates',
    cols: ['name_ar', 'employer', 'position_or_about', 'years_experience', 'national_id',
           'email', 'phone', 'nomination_type', 'confirmed_attending', 'entity_status',
           'notes', 'benefit_from_programs', 'program_name', 'country', 'program_start', 'program_end'],
  },
  candidates_status: {
    table: 'ops_candidates_status',
    cols: ['name_ar', 'name_en', 'gender', 'employer', 'position_or_about', 'years_experience',
           'national_id', 'email', 'phone', 'nomination_type', 'candidate_occasion',
           'nomination_status', 'entity_status', 'notes', 'benefit_from_programs',
           'program_name', 'program_classification', 'program_type', 'program_level',
           'country', 'program_start', 'program_end', 'program_owner'],
  },
  gov_entities: { table: 'ops_gov_entities', cols: ['entity_name'] },
  withdrawals: {
    table: 'ops_withdrawals',
    cols: ['name_ar', 'name_en', 'employer', 'national_id', 'email', 'phone',
           'program_name', 'country', 'city', 'program_type', 'program_start', 'program_end',
           'qudratok_action', 'withdrawal_date', 'justification', 'withdrawal_method', 'notes'],
  },
  beneficiaries: {
    table: 'ops_beneficiaries',
    cols: ['name_ar', 'employer', 'national_id', 'email', 'phone',
           'program_name', 'program_type', 'program_start', 'program_end'],
  },
};

const INT_COLS = new Set(['years_experience']);

function coerce(col: string, val: unknown): unknown {
  if (val === undefined || val === null || val === '') return null;
  if (INT_COLS.has(col)) {
    const n = parseInt(String(val), 10);
    return isNaN(n) ? null : n;
  }
  return val;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token')
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      file_hash: string;
      sheet: string;
      rows: Record<string, unknown>[];
      truncate?: boolean;
    };

    const cfg = SHEET_TO_TABLE[body.sheet];
    if (!cfg) {
      return NextResponse.json({ ok: false, error: `unknown sheet: ${body.sheet}` }, { status: 400 });
    }

    // Normalize: ensure every row has all cols (null where missing)
    const rowsNorm = body.rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const c of cfg.cols) out[c] = coerce(c, r[c]);
      return out;
    });

    const logRows = await db<{ id: string }[]>`
      INSERT INTO data_sync_log (source_file, sheet, file_hash, rows_total, status)
      VALUES ('operations.xlsx', ${body.sheet}, ${body.file_hash}, ${rowsNorm.length}, 'running')
      RETURNING id
    `;
    const logId = logRows[0].id;

    try {
      await db.begin(async (tx) => {
        if (body.truncate) {
          await tx.unsafe(`TRUNCATE TABLE ${cfg.table} RESTART IDENTITY`);
        }
        if (rowsNorm.length > 0) {
          // Bulk insert via postgres.js native syntax
          await tx`INSERT INTO ${tx(cfg.table)} ${tx(rowsNorm as never[], ...(cfg.cols as never[]))}`;
        }
      });

      await db`
        UPDATE data_sync_log
        SET finished_at=NOW(), rows_inserted=${rowsNorm.length}, status='success'
        WHERE id=${logId}
      `;
      return NextResponse.json({
        ok: true, sheet: body.sheet, rows: rowsNorm.length, truncated: !!body.truncate,
      });
    } catch (e) {
      const msg = (e as Error).message;
      await db`
        UPDATE data_sync_log SET finished_at=NOW(), status='failed', error_msg=${msg} WHERE id=${logId}
      `;
      console.error(`[sync/operations] ${body.sheet}:`, msg);
      return NextResponse.json({ ok: false, sheet: body.sheet, error: msg }, { status: 500 });
    }
  } catch (err) {
    console.error('[sync/operations]', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token')
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const recent = await db`
    SELECT source_file, sheet, started_at, finished_at, status, rows_inserted, error_msg
    FROM data_sync_log ORDER BY started_at DESC LIMIT 30
  `;
  return NextResponse.json({ ok: true, recent });
}
