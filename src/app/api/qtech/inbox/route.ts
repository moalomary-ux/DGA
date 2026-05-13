import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const FIELDS = `
  qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
  qi.subject, qi.received_at, qi.status,
  qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
  qi.sender_org_id, eo.name_ar AS sender_org_name,
  qi.assigned_to,
  COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
  qi.read_at,
  qi.liaison_id,
  l.name AS liaison_name,
  l.title AS liaison_title,
  org_l.name_ar AS liaison_org_name
`;

const JOIN_CLAUSE = `
  LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
  LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
  LEFT JOIN users u ON u.id = qi.assigned_to
  LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
  LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
`;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const programId = searchParams.get('program_id');
  const assignedToMe = searchParams.get('mine') === '1';
  const search = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  try {
    let rows;

    if (search && search.trim().length > 0) {
      const pat = `%${search.trim()}%`;
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        WHERE qi.subject ILIKE ${pat} 
           OR qi.from_addr ILIKE ${pat} 
           OR qi.from_name ILIKE ${pat}
           OR qi.body_text ILIKE ${pat}
           OR l.name ILIKE ${pat}
           OR org_l.name_ar ILIKE ${pat}
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    } else if (status && programId) {
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        WHERE qi.status = ${status} AND qi.program_id = ${parseInt(programId, 10)}
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    } else if (status) {
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        WHERE qi.status = ${status}
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    } else if (programId) {
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        WHERE qi.program_id = ${parseInt(programId, 10)}
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    } else if (assignedToMe) {
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        WHERE qi.assigned_to = ${session.userId}
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT qi.id, qi.apple_msg_id, qi.from_addr, qi.from_name,
          qi.subject, qi.received_at, qi.status,
          qi.program_id, ep.title_ar AS program_title, ep.code AS program_code,
          qi.sender_org_id, eo.name_ar AS sender_org_name,
          qi.assigned_to,
          COALESCE(u.name_ar, u.name_en, u.email) AS assigned_to_name,
          qi.read_at,
          qi.liaison_id, l.name AS liaison_name, l.title AS liaison_title,
          org_l.name_ar AS liaison_org_name
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN users u ON u.id = qi.assigned_to
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        LEFT JOIN qtech_orgs org_l ON org_l.id = l.org_id
        ORDER BY qi.received_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({
      messages: rows,
      pagination: { limit, count: rows.length },
    });
  } catch (e: any) {
    console.error('qtech inbox v3 error:', e);
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
