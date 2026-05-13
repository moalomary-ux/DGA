import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * يولّد ملف .eml قابل للفتح في Outlook.
 * RFC 5322 compliant — يدعم العربي عبر MIME encoded-words + UTF-8 quoted-printable.
 */
function buildEml(opts: {
  to_email: string; to_name: string; cc?: string;
  subject: string; body_html: string; body_plain?: string;
}) {
  const boundary = `----=_QtechBoundary_${Date.now()}`;
  const date = new Date().toUTCString();
  const subjEncoded = `=?UTF-8?B?${Buffer.from(opts.subject, 'utf-8').toString('base64')}?=`;
  const toName = opts.to_name ? `=?UTF-8?B?${Buffer.from(opts.to_name, 'utf-8').toString('base64')}?=` : '';
  const toLine = toName ? `${toName} <${opts.to_email}>` : opts.to_email;

  // body_plain fallback من body_html
  const plain = opts.body_plain || opts.body_html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');

  // base64 encoding للـ UTF-8 (أبسط وأكثر توافقاً مع Outlook العربي)
  const plainB64 = Buffer.from(plain, 'utf-8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
  const htmlB64  = Buffer.from(opts.body_html, 'utf-8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';

  return [
    `Date: ${date}`,
    `From: =?UTF-8?B?US10ZWNoIERHQQ==?= <Q-tech@dga.gov.sa>`,
    `To: ${toLine}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    `Subject: ${subjEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `X-Generator: Qtech Communication Center`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    plainB64,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlB64,
    ``,
    `--${boundary}--`,
    ``,
  ].filter((l) => l !== null).join('\r\n');
}

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { template_id, program_id, nominee_id, to_email, to_name, cc, subject, body_html, body_plain, variables } = body;

  if (!to_email || !subject) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  // استبدال المتغيرات (إن وُجدت)
  const vars: Record<string, string> = variables || {};
  if (program_id) {
    const p = await db<{ name_ar: string; start_date: Date | null; end_date: Date | null; location: string | null }[]>`
      SELECT title_ar AS name_ar, start_date, end_date, NULL::text AS location FROM ecosystem_programs WHERE id = ${program_id}
    `;
    if (p.length > 0) {
      vars.program_name = p[0].name_ar;
      if (p[0].start_date) vars.start_date = new Date(p[0].start_date).toLocaleDateString('ar-SA');
      if (p[0].end_date)   vars.end_date   = new Date(p[0].end_date).toLocaleDateString('ar-SA');
      if (p[0].location)   vars.location   = p[0].location;
    }
  }
  if (to_name) vars.trainee_name = to_name;

  const finalSubject = applyVariables(subject, vars);
  const finalHtml    = applyVariables(body_html, vars);
  const finalPlain   = body_plain ? applyVariables(body_plain, vars) : undefined;

  const eml = buildEml({
    to_email, to_name: to_name || '', cc,
    subject: finalSubject,
    body_html: finalHtml,
    body_plain: finalPlain,
  });

  // نحفظ في email_outbox
  try {
    await db`
      INSERT INTO email_outbox (template_id, program_id, nominee_id, to_email, to_name, cc, subject, body_html, body_plain, status, exported_at, generated_by)
      VALUES (${template_id || null}, ${program_id || null}, ${nominee_id || null},
              ${to_email}, ${to_name || null}, ${cc || null},
              ${finalSubject}, ${finalHtml}, ${finalPlain || null},
              'exported', NOW(), ${session.userId})
    `;
  } catch (e) {
    console.error('email_outbox insert failed:', e);
  }

  return NextResponse.json({ ok: true, eml_content: eml, eml_url: 'inline' });
}
