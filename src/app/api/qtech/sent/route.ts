import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  try {
    let rows;
    if (status === 'draft') {
      rows = await db<any[]>`
        SELECT 
          eo.id, eo.to_email, eo.to_name, eo.subject, eo.body_plain,
          eo.status, eo.created_at, eo.sent_at, eo.exported_at,
          et.code AS template_code,
          ep.title_ar AS program_title
        FROM email_outbox eo
        LEFT JOIN email_template_library et ON et.id = eo.template_id
        LEFT JOIN ecosystem_programs ep ON ep.id = eo.program_id
        WHERE eo.status = 'draft'
        ORDER BY eo.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT 
          eo.id, eo.to_email, eo.to_name, eo.subject, eo.body_plain,
          eo.status, eo.created_at, eo.sent_at, eo.exported_at,
          et.code AS template_code,
          ep.title_ar AS program_title
        FROM email_outbox eo
        LEFT JOIN email_template_library et ON et.id = eo.template_id
        LEFT JOIN ecosystem_programs ep ON ep.id = eo.program_id
        WHERE eo.status IN ('sent','exported')
        ORDER BY COALESCE(eo.sent_at, eo.exported_at, eo.created_at) DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ messages: rows });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
