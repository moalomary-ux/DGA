import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const program_id = parseInt(idStr, 10);
  if (!program_id) return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });

  const { step_id, task_index, done, close_note } = await req.json();
  if (typeof step_id !== 'number' || typeof task_index !== 'number') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  // Get user name
  const userRow = await db`SELECT name_ar, name_en FROM users WHERE id = ${session.userId} LIMIT 1`;
  const userName = userRow[0]?.name_ar || userRow[0]?.name_en || 'مستخدم';

  if (done) {
    // Upsert as done
    await db`
      INSERT INTO program_task_states (program_id, step_id, task_index, done, closed_by_user_id, closed_by_name, closed_at, close_note)
      VALUES (${program_id}, ${step_id}, ${task_index}, TRUE, ${session.userId}, ${userName}, NOW(), ${close_note || null})
      ON CONFLICT (program_id, step_id, task_index) DO UPDATE SET
        done = TRUE,
        closed_by_user_id = EXCLUDED.closed_by_user_id,
        closed_by_name = EXCLUDED.closed_by_name,
        closed_at = NOW(),
        close_note = EXCLUDED.close_note
    `;
  } else {
    // Mark as undone (keep history? no — overwrite for simplicity)
    await db`
      INSERT INTO program_task_states (program_id, step_id, task_index, done, closed_by_name, close_note)
      VALUES (${program_id}, ${step_id}, ${task_index}, FALSE, NULL, NULL)
      ON CONFLICT (program_id, step_id, task_index) DO UPDATE SET
        done = FALSE,
        closed_by_user_id = NULL,
        closed_by_name = NULL,
        closed_at = NOW(),
        close_note = NULL
    `;
  }

  return NextResponse.json({ ok: true });
}
