import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const boardId = url.searchParams.get('board');

  if (!boardId) {
    // قائمة البوردز فقط
    const boards = await db`
      SELECT b.id, b.name, b.workspace_name, b.items_count, b.url, b.synced_at,
             b.board_updated_at,
             (SELECT COUNT(*) FROM monday_items WHERE board_id = b.id)::int AS synced_items
      FROM monday_boards b
      WHERE b.state = 'active' AND b.items_count > 0
      ORDER BY b.board_updated_at DESC NULLS LAST
    `;
    return NextResponse.json({ ok: true, boards });
  }

  const bid = parseInt(boardId, 10);
  if (isNaN(bid)) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const q = url.searchParams.get('q')?.trim();
  const status = url.searchParams.get('status')?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(10, parseInt(url.searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  const board = await db<{ id: string; name: string; items_count: number; synced_at: Date }[]>`
    SELECT id, name, items_count, synced_at FROM monday_boards WHERE id = ${bid}
  `;
  if (!board[0]) return NextResponse.json({ error: 'board not found' }, { status: 404 });

  const columns = await db`
    SELECT column_id, title, type, settings, position
    FROM monday_columns WHERE board_id = ${bid} ORDER BY position
  `;

  const where: string[] = [`board_id = ${bid}`];
  const params: unknown[] = [];
  let i = 1;
  if (q) {
    where.push(`(name ILIKE $${i} OR person_name ILIKE $${i})`);
    params.push(`%${q}%`); i++;
  }
  if (status) {
    where.push(`status = $${i}`); params.push(status); i++;
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const totalRow = await db.unsafe<{ cnt: number }[]>(
    `SELECT COUNT(*)::int cnt FROM monday_items ${whereSql}`, params as never[]
  );
  const total = totalRow[0]?.cnt || 0;

  const items = await db.unsafe<Record<string, unknown>[]>(
    `SELECT id, name, status, status_index, person_name, timeline_start, timeline_end,
            item_updated_at, vals
     FROM monday_items ${whereSql}
     ORDER BY status_index NULLS LAST, name LIMIT ${limit} OFFSET ${offset}`,
    params as never[]
  );

  let statuses: { v: string; cnt: number }[] = [];
  if (page === 1) {
    statuses = await db<{ v: string; cnt: number }[]>`
      SELECT status v, COUNT(*)::int cnt FROM monday_items
      WHERE board_id = ${bid} AND status IS NOT NULL
      GROUP BY status ORDER BY cnt DESC
    `;
  }

  return NextResponse.json({
    ok: true, board: board[0], columns, items,
    total, page, pages: Math.ceil(total / limit), statuses,
  });
}
