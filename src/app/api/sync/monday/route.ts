import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token')
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      boards?: Array<{
        id: number; name: string; description?: string; state?: string;
        workspace_id?: number; workspace_name?: string; items_count?: number;
        url?: string; board_updated_at?: string;
      }>;
      columns?: Array<{
        board_id: number; column_id: string; title: string; type?: string;
        settings?: unknown; position?: number;
      }>;
      items?: Array<{
        id: number; board_id: number; name: string; status?: string;
        status_index?: number; person_name?: string;
        timeline_start?: string; timeline_end?: string;
        item_created_at?: string; item_updated_at?: string;
        vals?: Record<string, unknown>;
      }>;
      board_ids_to_replace?: number[];  // truncate items for these boards before insert
    };

    const result: Record<string, number> = {};

    if (body.board_ids_to_replace?.length) {
      await db`DELETE FROM monday_items WHERE board_id = ANY(${body.board_ids_to_replace})`;
    }

    if (body.boards?.length) {
      for (const b of body.boards) {
        await db`
          INSERT INTO monday_boards (id, name, description, state, workspace_id, workspace_name, items_count, url, board_updated_at)
          VALUES (${b.id}, ${b.name}, ${b.description || null}, ${b.state || null},
                  ${b.workspace_id || null}, ${b.workspace_name || null}, ${b.items_count || 0},
                  ${b.url || null}, ${b.board_updated_at || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description, state = EXCLUDED.state,
            workspace_id = EXCLUDED.workspace_id, workspace_name = EXCLUDED.workspace_name,
            items_count = EXCLUDED.items_count, url = EXCLUDED.url,
            board_updated_at = EXCLUDED.board_updated_at, synced_at = NOW()
        `;
      }
      result.boards = body.boards.length;
    }

    if (body.columns?.length) {
      const boardIds = [...new Set(body.columns.map(c => c.board_id))];
      await db`DELETE FROM monday_columns WHERE board_id = ANY(${boardIds})`;
      for (const c of body.columns) {
        await db`
          INSERT INTO monday_columns (board_id, column_id, title, type, settings, position)
          VALUES (${c.board_id}, ${c.column_id}, ${c.title}, ${c.type || null},
                  ${c.settings ? JSON.stringify(c.settings) : null}::jsonb, ${c.position || 0})
        `;
      }
      result.columns = body.columns.length;
    }

    if (body.items?.length) {
      for (const it of body.items) {
        await db`
          INSERT INTO monday_items (id, board_id, name, status, status_index, person_name,
            timeline_start, timeline_end, item_created_at, item_updated_at, vals)
          VALUES (${it.id}, ${it.board_id}, ${it.name}, ${it.status || null},
                  ${it.status_index ?? null}, ${it.person_name || null},
                  ${it.timeline_start || null}, ${it.timeline_end || null},
                  ${it.item_created_at || null}, ${it.item_updated_at || null},
                  ${it.vals ? JSON.stringify(it.vals) : null}::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, status = EXCLUDED.status, status_index = EXCLUDED.status_index,
            person_name = EXCLUDED.person_name, timeline_start = EXCLUDED.timeline_start,
            timeline_end = EXCLUDED.timeline_end, item_updated_at = EXCLUDED.item_updated_at,
            vals = EXCLUDED.vals, synced_at = NOW()
        `;
      }
      result.items = body.items.length;
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[sync/monday]', err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token')
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const counts = await db<{ tbl: string; cnt: number }[]>`
    SELECT 'boards' tbl, COUNT(*)::int cnt FROM monday_boards
    UNION ALL SELECT 'columns', COUNT(*)::int FROM monday_columns
    UNION ALL SELECT 'items', COUNT(*)::int FROM monday_items
  `;
  return NextResponse.json({ ok: true, counts });
}
