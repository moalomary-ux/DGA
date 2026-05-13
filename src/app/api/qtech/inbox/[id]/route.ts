import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GOVT_DOMAINS_REGEX = /\.(gov|gov\.sa|edu\.sa|mil)$/i;
const PUBLIC_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com'];

function extractEmail(addr: string): string {
  if (!addr) return '';
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim().toLowerCase();
}

function getDomain(email: string): string {
  const at = email.indexOf('@');
  return at >= 0 ? email.substring(at + 1).toLowerCase() : '';
}

// ════════════════════════════════════════════════════════════════
// Detect sender type: liaison | beneficiary | govt | external
// ════════════════════════════════════════════════════════════════
async function detectSenderType(fromAddr: string): Promise<{
  type: 'liaison' | 'beneficiary' | 'govt' | 'external';
  liaison?: any;
  beneficiary?: any;
  org_name?: string;
}> {
  const email = extractEmail(fromAddr);
  if (!email) return { type: 'external' };

  // 1. تحقق من ضباط الاتصال
  const [liaison] = await db<any[]>`
    SELECT l.*, o.name_ar AS org_name, o.sector AS org_sector, o.classification AS org_classification
    FROM qtech_liaisons l
    LEFT JOIN qtech_orgs o ON o.id = l.org_id
    WHERE LOWER(l.email) = ${email} LIMIT 1
  `;
  if (liaison) return { type: 'liaison', liaison, org_name: liaison.org_name };

  // 2. تحقق من المستفيدين
  const [beneficiary] = await db<any[]>`
    SELECT b.id, b.name, b.job_title, b.email, b.target_level, b.year,
           o.name_ar AS org_name, o.sector AS org_sector,
           p.title AS last_program_title
    FROM qtech_beneficiaries b
    LEFT JOIN qtech_orgs o ON o.id = b.org_id
    LEFT JOIN qtech_programs p ON p.id = b.program_id
    WHERE LOWER(b.email) = ${email}
    ORDER BY b.year DESC NULLS LAST LIMIT 1
  `;
  if (beneficiary) return { type: 'beneficiary', beneficiary, org_name: beneficiary.org_name };

  // 3. تحقق من الـ domain
  const domain = getDomain(email);
  if (PUBLIC_EMAIL_DOMAINS.includes(domain)) return { type: 'external' };
  if (GOVT_DOMAINS_REGEX.test(domain) || domain.endsWith('.gov.sa')) {
    // جهة حكومية لكن المرسل غير معروف
    const [org] = await db<any[]>`
      SELECT name_ar FROM qtech_orgs WHERE email_domain = ${domain} OR email_domain = ${'@' + domain} LIMIT 1
    `;
    return { type: 'govt', org_name: org?.name_ar };
  }

  return { type: 'external' };
}

// ════════════════════════════════════════════════════════════════
// GET /api/qtech/inbox/[id]
// ════════════════════════════════════════════════════════════════
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  try {
    const [message] = await db<any[]>`
      SELECT qi.*, 
             l.name AS liaison_name, l.title AS liaison_title, l.id AS liaison_id,
             o.name_ar AS liaison_org_name, o.id AS liaison_org_id
      FROM qtech_inbound qi
      LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
      LEFT JOIN qtech_orgs o ON o.id = l.org_id
      WHERE qi.id = ${id}
    `;
    if (!message) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // ── Detect sender type ──
    const senderInfo = await detectSenderType(message.from_addr);

    // ── Build liaison detail ──
    let liaisonDetail: any = null;
    if (senderInfo.type === 'liaison' && senderInfo.liaison) {
      const l = senderInfo.liaison;
      const recentPrograms = await db<any[]>`
        SELECT p.id, p.title, p.year, p.type, COUNT(b.id)::int AS beneficiaries_count
        FROM qtech_programs p
        INNER JOIN qtech_beneficiaries b ON b.program_id = p.id AND b.org_id = ${l.org_id}
        GROUP BY p.id ORDER BY p.year DESC NULLS LAST, p.start_date DESC NULLS LAST LIMIT 5
      `;
      const [orgStats] = await db<any[]>`
        SELECT total_beneficiaries_count, total_programs_count, total_quota_seats
        FROM qtech_orgs WHERE id = ${l.org_id} LIMIT 1
      `;
      liaisonDetail = {
        ...l,
        org_beneficiaries: orgStats?.total_beneficiaries_count,
        org_programs_count: orgStats?.total_programs_count,
        org_quota: orgStats?.total_quota_seats,
        recent_programs: recentPrograms,
      };
    }

    return NextResponse.json({
      message,
      liaison: liaisonDetail,
      sender: {
        type: senderInfo.type,
        liaison: senderInfo.liaison || null,
        beneficiary: senderInfo.beneficiary || null,
        org_name: senderInfo.org_name || null,
      },
    });
  } catch (e: any) {
    console.error('[inbox/id]', e.message);
    return NextResponse.json({ error: 'db_error', detail: e.message?.substring(0, 300) }, { status: 500 });
  }
}

// ════════════════════════════════════════════════════════════════
// PATCH /api/qtech/inbox/[id]
// ════════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const data = await req.json();
  const { action } = data;

  try {
    if (action === 'mark_read') {
      await db`UPDATE qtech_inbound SET status='read', read_at=NOW() WHERE id=${id} AND status='new'`;
    } else if (action === 'flag') {
      await db`UPDATE qtech_inbound SET status='flagged' WHERE id=${id}`;
    } else if (action === 'archive') {
      await db`UPDATE qtech_inbound SET status='archived' WHERE id=${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'db_error', detail: e.message }, { status: 500 });
  }
}
