import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://10.10.10.2:7080';
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || process.env.BRIDGE_TOKEN || '';
const DEFAULT_BCC = 'skills@qtech.help';

// ════════════════════════════════════════════════════════════════
// Schema cache — يكتشف الـ columns الفعلية مرة واحدة ويحفظها
// ════════════════════════════════════════════════════════════════
let _outboxColumns: Set<string> | null = null;

async function getOutboxColumns(): Promise<Set<string>> {
  if (_outboxColumns) return _outboxColumns;
  const cols = await db<any[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'email_outbox' AND table_schema = 'public'
  `;
  _outboxColumns = new Set(cols.map((c) => c.column_name));
  console.log('[email_outbox columns]:', Array.from(_outboxColumns).join(', '));
  return _outboxColumns;
}

function pickCol(cols: Set<string>, candidates: string[]): string | null {
  for (const c of candidates) if (cols.has(c)) return c;
  return null;
}

// ════════════════════════════════════════════════════════════════
// توليد initials من الاسم: محمد العمري → "م.ع" / Mohammed Alomary → "MA"
// ════════════════════════════════════════════════════════════════
function genInitials(name: string | null | undefined): string {
  if (!name) return 'QT';
  const clean = String(name).replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'QT';
  if (parts.length === 1) return parts[0].substring(0, 2);
  // Arabic: حرف أول من أول كلمتين
  const isArabic = /[\u0600-\u06FF]/.test(parts[0]);
  if (isArabic) return parts[0][0] + parts[1][0];
  // English: حرف أول من أول كلمتين uppercase
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ════════════════════════════════════════════════════════════════
// إضافة توقيع HTML تلقائي مع الـ user initials
// ════════════════════════════════════════════════════════════════
function appendSignature(body: string, userName: string | null, isHtml: boolean): string {
  const initials = genInitials(userName);
  const sigHtml = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:-apple-system,'Segoe UI',sans-serif;direction:rtl;text-align:right;color:#374151;font-size:14px;line-height:1.6;">
  <div style="color:#0891b2;font-weight:700;font-size:15px;margin-bottom:2px;">فريق برنامج قدراتك</div>
  <div style="color:#6b7280;font-size:12px;">هيئة الحكومة الرقمية</div>
  <div style="color:#9ca3af;font-size:10px;font-family:monospace;margin-top:6px;letter-spacing:1px;">[${initials}]</div>
</div>`;

  if (isHtml) {
    return body + sigHtml;
  }
  // text → نلصق التوقيع كـ نص
  return body + `\n\n--\nمع التحية،\nفريق برنامج قدراتك\nهيئة الحكومة الرقمية\n[${initials}]`;
}

// ════════════════════════════════════════════════════════════════
// POST /api/qtech/send
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const data = await req.json();
  const { to, bcc, subject, body: msgBody, body_html, in_reply_to } = data;

  if (!to || !subject || !msgBody) {
    return NextResponse.json({ error: 'missing_fields', detail: 'to, subject, body required' }, { status: 400 });
  }

  const bccAddr = bcc || DEFAULT_BCC;

  // اكتشف الـ schema
  const cols = await getOutboxColumns();
  const TO_COL = pickCol(cols, ['to_addr', 'to_email', 'recipient', 'to_address', 'to']);
  const BCC_COL = pickCol(cols, ['bcc', 'bcc_addr', 'bcc_email']);
  const SUBJ_COL = pickCol(cols, ['subject', 'subj', 'title']);
  const BODY_COL = pickCol(cols, ['body', 'content', 'body_text', 'message']);
  const HTML_COL = pickCol(cols, ['is_html', 'html', 'body_html_flag']);
  const REPLY_COL = pickCol(cols, ['in_reply_to', 'reply_to_id', 'parent_id']);
  const STATUS_COL = pickCol(cols, ['status', 'state']);
  const QUEUED_COL = pickCol(cols, ['queued_at', 'created_at', 'created']);
  const TENANT_COL = pickCol(cols, ['tenant', 'tenant_id']);
  const SENDER_COL = pickCol(cols, ['from_user_id', 'sender_id', 'user_id', 'created_by']);

  if (!TO_COL || !SUBJ_COL || !BODY_COL) {
    return NextResponse.json({
      error: 'schema_unrecognized',
      detail: 'email_outbox: required columns not found',
      schema: Array.from(cols),
      hint: 'Need at least to_*, subject, body columns',
    }, { status: 500 });
  }

  // اجلب اسم الـ user من الـ users table
  let userName: string | null = null;
  try {
    const [u] = await db<any[]>`
      SELECT COALESCE(full_name, name, email) AS display_name
      FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    userName = u?.display_name || null;
  } catch {}

  // أضف التوقيع للـ body
  const finalBody = appendSignature(msgBody, userName, !!body_html);

  // ابني الـ INSERT dynamically
  const insertCols: string[] = [];
  const insertVals: any[] = [];

  insertCols.push(TO_COL); insertVals.push(to);
  insertCols.push(SUBJ_COL); insertVals.push(subject);
  insertCols.push(BODY_COL); insertVals.push(finalBody);

  if (BCC_COL) { insertCols.push(BCC_COL); insertVals.push(bccAddr); }
  if (HTML_COL) { insertCols.push(HTML_COL); insertVals.push(!!body_html); }
  if (REPLY_COL && in_reply_to) { insertCols.push(REPLY_COL); insertVals.push(in_reply_to); }
  if (STATUS_COL) { insertCols.push(STATUS_COL); insertVals.push('queued'); }
  if (QUEUED_COL) { insertCols.push(QUEUED_COL); insertVals.push(new Date()); }
  if (TENANT_COL) { insertCols.push(TENANT_COL); insertVals.push('qtech'); }
  if (SENDER_COL) { insertCols.push(SENDER_COL); insertVals.push(session.userId); }

  // ابني الـ SQL يدوياً (لأن number of cols ديناميكي)
  const colsList = insertCols.map((c) => `"${c}"`).join(', ');
  const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO email_outbox (${colsList}) VALUES (${placeholders}) RETURNING id`;

  let outboxId: number;
  try {
    const result: any = await db.unsafe(sql, insertVals);
    outboxId = result[0].id;
  } catch (e: any) {
    return NextResponse.json({
      error: 'db_insert_failed',
      detail: e.message?.substring(0, 400),
      schema_used: { TO_COL, SUBJ_COL, BODY_COL, BCC_COL, HTML_COL, STATUS_COL },
    }, { status: 500 });
  }

  // ابعت للـ Bridge
  try {
    const bridgeResp = await fetch(`${BRIDGE_URL}/qtech/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-bridge-token': BRIDGE_TOKEN,
      },
      body: JSON.stringify({
        to, bcc: bccAddr, subject, body: finalBody, is_html: !!body_html,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!bridgeResp.ok) {
      const errText = await bridgeResp.text();
      if (STATUS_COL) {
        await db.unsafe(
          `UPDATE email_outbox SET "${STATUS_COL}" = $1 WHERE id = $2`,
          ['failed', outboxId]
        );
      }
      return NextResponse.json({
        error: 'bridge_failed',
        detail: errText.substring(0, 300),
        outbox_id: outboxId,
      }, { status: 502 });
    }

    const bridgeData = await bridgeResp.json();
    if (STATUS_COL) {
      const sentCol = pickCol(cols, ['sent_at', 'completed_at']);
      if (sentCol) {
        await db.unsafe(
          `UPDATE email_outbox SET "${STATUS_COL}" = $1, "${sentCol}" = $2 WHERE id = $3`,
          ['sent', new Date(), outboxId]
        );
      } else {
        await db.unsafe(
          `UPDATE email_outbox SET "${STATUS_COL}" = $1 WHERE id = $2`,
          ['sent', outboxId]
        );
      }
    }

    if (in_reply_to) {
      try {
        await db`UPDATE qtech_inbound SET status='replied' WHERE id=${in_reply_to}`;
      } catch {}
    }

    return NextResponse.json({ ok: true, outbox_id: outboxId, bridge: bridgeData });
  } catch (e: any) {
    if (STATUS_COL) {
      try { await db.unsafe(`UPDATE email_outbox SET "${STATUS_COL}" = $1 WHERE id = $2`, ['failed', outboxId]); } catch {}
    }
    return NextResponse.json({
      error: 'bridge_unreachable',
      detail: e.message?.substring(0, 200),
      outbox_id: outboxId,
    }, { status: 503 });
  }
}
