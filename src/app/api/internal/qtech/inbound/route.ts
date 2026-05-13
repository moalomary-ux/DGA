import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || '';

export const dynamic = 'force-dynamic';

type IncomingMsg = {
  apple_msg_id: string;
  received_at: string;
  from_addr: string;
  from_name: string | null;
  subject: string;
  body_text: string;
  read: boolean;
  program_code_hint: string | null;
};

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!TOKEN || !auth || auth !== `Bearer ${TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { messages: IncomingMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const m of messages) {
    try {
      // 1. classify program via code hint
      let programId: number | null = null;
      if (m.program_code_hint) {
        const hint = m.program_code_hint;
        const matched = await db<{ id: number }[]>`
          SELECT id FROM ecosystem_programs
          WHERE code = ${hint} 
             OR id::text = ${hint}
             OR code = ${'QT-' + hint}
          LIMIT 1
        `;
        if (matched[0]) programId = matched[0].id;
      }

      // 2. classify sender org via email domain
      let senderOrgId: number | null = null;
      const domain = (m.from_addr || '').split('@')[1]?.toLowerCase() || '';
      if (domain) {
        const org = await db<{ id: number }[]>`
          SELECT id FROM ecosystem_organizations
          WHERE LOWER(name_ar) LIKE ${'%' + domain.split('.')[0] + '%'}
             OR LOWER(name_en) LIKE ${'%' + domain.split('.')[0] + '%'}
          LIMIT 1
        `;
        if (org[0]) senderOrgId = org[0].id;
      }

      // 3. idempotent insert
      const result = await db<{ id: number }[]>`
        INSERT INTO qtech_inbound (
          apple_msg_id, message_id_hdr, from_addr, from_name,
          subject, body_text, received_at,
          program_id, sender_org_id, 
          status, read_at
        ) VALUES (
          ${m.apple_msg_id}, ${m.apple_msg_id}, ${m.from_addr}, ${m.from_name},
          ${m.subject}, ${m.body_text}, ${m.received_at},
          ${programId}, ${senderOrgId},
          ${m.read ? 'read' : 'new'},
          ${m.read ? new Date().toISOString() : null}
        )
        ON CONFLICT (apple_msg_id) DO NOTHING
        RETURNING id
      `;

      if (result[0]) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (e: any) {
      errors.push(`${m.apple_msg_id}: ${e.message || 'unknown'}`);
      skipped++;
    }
  }

  return NextResponse.json({
    inserted,
    skipped,
    total: messages.length,
    errors: errors.slice(0, 5),
  });
}
