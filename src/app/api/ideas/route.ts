import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const ideas = await db`
    SELECT i.*, 
      (SELECT COUNT(*)::int FROM kg_idea_comments c WHERE c.idea_id = i.id) AS comment_count
    FROM kg_ideas i ORDER BY i.votes DESC, i.created_at DESC
  `;
  return NextResponse.json({ ok: true, ideas });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, id, title, type, description, status } = body;

  if (action === 'create') {
    await db`INSERT INTO kg_ideas (title, type, description, author_name) VALUES (${title}, ${type || 'training'}, ${description || ''}, ${(session.user?.email || 'مستخدم') as string})`;
  } else if (action === 'upvote') {
    await db`UPDATE kg_ideas SET votes = votes + 1 WHERE id = ${id}`;
  } else if (action === 'move' && status) {
    await db`UPDATE kg_ideas SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}
