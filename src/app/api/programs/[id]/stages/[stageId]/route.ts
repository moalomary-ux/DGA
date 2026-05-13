import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id, stageId } = await params;
  const programId = parseInt(id, 10);
  const stageIdNum = parseInt(stageId, 10);
  const body = await req.json();
  const { status } = body;

  const validStatuses = ['pending','active','done','blocked'];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'bad status' }, { status: 400 });

  // Get current stage
  const cur = await db<{ stage_code: string; status: string; stage_label: string }[]>`
    SELECT stage_code, status, stage_label FROM program_stages
    WHERE id = ${stageIdNum} AND program_id = ${programId}
  `;
  if (cur.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Update timestamps
  if (status === 'active') {
    await db`UPDATE program_stages SET status = 'active', started_at = COALESCE(started_at, NOW()) WHERE id = ${stageIdNum}`;
  } else if (status === 'done') {
    await db`UPDATE program_stages SET status = 'done', finished_at = NOW(), started_at = COALESCE(started_at, NOW()) WHERE id = ${stageIdNum}`;
  } else {
    await db`UPDATE program_stages SET status = ${status} WHERE id = ${stageIdNum}`;
  }

  // Log
  await db`
    INSERT INTO program_stage_history (program_id, from_stage, to_stage, changed_by)
    VALUES (${programId}, ${cur[0].status}, ${status}, ${session.userId})
  `;
  await db`
    INSERT INTO program_activity (program_id, actor_id, actor_name, action, description)
    VALUES (${programId}, ${session.userId}, ${session.nameAr || ''}, 'stage_changed',
      ${'انتقل من "' + cur[0].status + '" إلى "' + status + '" — مرحلة "' + cur[0].stage_label + '"'})
  `;

  return NextResponse.json({ ok: true });
}
