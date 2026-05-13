import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });

  const rows = await db`
    SELECT step_id, task_index, done, closed_by_name, closed_at, close_note
    FROM program_task_states
    WHERE program_id = ${id}
  `;

  // Convert to { "stepId-taskIndex": state } map
  const states: Record<string, unknown> = {};
  for (const r of rows) {
    const k = `${r.step_id}-${r.task_index}`;
    states[k] = {
      done: r.done,
      closed_by_name: r.closed_by_name,
      closed_at: r.closed_at ? new Date(r.closed_at).toISOString() : null,
      close_note: r.close_note,
    };
  }

  return NextResponse.json({ ok: true, states });
}
