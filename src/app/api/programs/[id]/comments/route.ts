import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const programId = parseInt(id, 10);
  const body = await req.json();
  const { body: text, comment_type, parent_id, author_name } = body;

  if (!text || !text.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const validTypes = ['note','update','alert','blocker','decision','question'];
  const ctype = validTypes.includes(comment_type) ? comment_type : 'note';

  await db`
    INSERT INTO program_comments (program_id, author_id, author_name, body, comment_type, parent_id)
    VALUES (${programId}, ${session.userId}, ${author_name || session.nameAr || ''}, ${text}, ${ctype}, ${parent_id || null})
  `;

  // log activity
  await db`
    INSERT INTO program_activity (program_id, actor_id, actor_name, action, description)
    VALUES (${programId}, ${session.userId}, ${author_name || session.nameAr || ''}, 'comment_added',
      ${'أضاف ' + ({ note:'ملاحظة', update:'تحديثاً', alert:'تنبيهاً', blocker:'معوّقاً', decision:'قراراً', question:'سؤالاً' } as Record<string,string>)[ctype]})
  `;

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { commentId, is_resolved, is_pinned } = body;
  if (!commentId) return NextResponse.json({ error: 'no commentId' }, { status: 400 });

  if (is_resolved !== undefined) {
    await db`UPDATE program_comments SET is_resolved = ${is_resolved} WHERE id = ${commentId}`;
  }
  if (is_pinned !== undefined) {
    await db`UPDATE program_comments SET is_pinned = ${is_pinned} WHERE id = ${commentId}`;
  }
  return NextResponse.json({ ok: true });
}
