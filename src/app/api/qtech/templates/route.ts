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
    const templates = await db<any[]>`
      SELECT 
        id, 
        template_code AS code, 
        name_ar, 
        category,
        subject AS subject_template, 
        body_plain AS body_template,
        body_html AS body_html_template,
        variables
      FROM email_template_library
      WHERE is_active = true
        AND (tenant = 'qtech' OR tenant IS NULL)
      ORDER BY 
        CASE category 
          WHEN 'acceptance' THEN 1
          WHEN 'rejection' THEN 2
          WHEN 'waitlist' THEN 3
          WHEN 'file_request' THEN 4
          WHEN 'reminder' THEN 5
          WHEN 'welcome' THEN 6
          WHEN 'certificate' THEN 7
          WHEN 'followup' THEN 8
          ELSE 99
        END,
        name_ar
    `;

    return NextResponse.json({ templates });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'db_error', detail: e.message },
      { status: 500 }
    );
  }
}
