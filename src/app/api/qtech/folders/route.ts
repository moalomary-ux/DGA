import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const inbox = await db<{ total: string; unread: string; assigned: string; flagged: string }[]>`
      SELECT 
        COUNT(*)::text AS total,
        (COUNT(*) FILTER (WHERE status = 'new'))::text AS unread,
        (COUNT(*) FILTER (WHERE assigned_to = ${session.userId}))::text AS assigned,
        (COUNT(*) FILTER (WHERE status = 'flagged'))::text AS flagged
      FROM qtech_inbound
    `;

    const sent = await db<{ sent: string; drafts: string }[]>`
      SELECT 
        (COUNT(*) FILTER (WHERE status IN ('sent','exported')))::text AS sent,
        (COUNT(*) FILTER (WHERE status = 'draft'))::text AS drafts
      FROM email_outbox
    `;

    return NextResponse.json({
      counts: {
        inbox: parseInt(inbox[0].total, 10),
        unread: parseInt(inbox[0].unread, 10),
        assigned: parseInt(inbox[0].assigned, 10),
        flagged: parseInt(inbox[0].flagged, 10),
        sent: parseInt(sent[0]?.sent || '0', 10),
        drafts: parseInt(sent[0]?.drafts || '0', 10),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
