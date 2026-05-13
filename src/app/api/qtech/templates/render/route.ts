import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function injectVars(text: string, vars: Record<string, any>): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
    out = out.replace(pattern, String(v ?? ''));
  }
  return out;
}

function parseFromAddr(addr: string): { name: string; email: string } {
  if (!addr) return { name: '', email: '' };
  const m = addr.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: '', email: addr.trim() };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { templateId, inboundId, programId, extraVars } = body;

  if (!templateId) {
    return NextResponse.json({ error: 'templateId required' }, { status: 400 });
  }

  try {
    const tRows = await db<any[]>`
      SELECT 
        template_code, name_ar, subject, 
        body_plain, body_html, variables
      FROM email_template_library
      WHERE id = ${templateId}
      LIMIT 1
    `;

    if (!tRows[0]) {
      return NextResponse.json({ error: 'template not found' }, { status: 404 });
    }

    const t = tRows[0];

    const ctx: Record<string, any> = { ...(extraVars || {}) };

    if (inboundId) {
      const inboundRows = await db<any[]>`
        SELECT 
          qi.from_addr, qi.from_name, qi.subject,
          ep.title_ar AS program_name,
          ep.title_en AS program_name_en,
          ep.start_date, ep.end_date, ep.code AS program_code,
          eo.name_ar AS sender_org,
          l.name AS liaison_name,
          l.title AS liaison_title
        FROM qtech_inbound qi
        LEFT JOIN ecosystem_programs ep ON ep.id = qi.program_id
        LEFT JOIN ecosystem_organizations eo ON eo.id = qi.sender_org_id
        LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
        WHERE qi.id = ${inboundId}
        LIMIT 1
      `;

      if (inboundRows[0]) {
        const ib = inboundRows[0];
        const parsed = parseFromAddr(ib.from_addr || '');
        
        // Liaison name takes priority (clean version)
        if (!ctx.trainee_name) {
          ctx.trainee_name = ib.liaison_name || ib.from_name || parsed.name || parsed.email.split('@')[0];
        }
        if (!ctx.trainee_email) ctx.trainee_email = parsed.email;
        if (!ctx.trainee_title && ib.liaison_title) ctx.trainee_title = ib.liaison_title;
        
        if (!ctx.program_name) ctx.program_name = ib.program_name || '';
        if (!ctx.program_code) ctx.program_code = ib.program_code || '';
        if (!ctx.start_date && ib.start_date) {
          ctx.start_date = new Date(ib.start_date).toLocaleDateString('ar-SA');
        }
        if (!ctx.end_date && ib.end_date) {
          ctx.end_date = new Date(ib.end_date).toLocaleDateString('ar-SA');
        }
        if (!ctx.organization) ctx.organization = ib.sender_org || '';
      }
    }

    if (programId && !ctx.program_name) {
      const pRows = await db<any[]>`
        SELECT title_ar AS program_name, code AS program_code,
               start_date, end_date
        FROM ecosystem_programs WHERE id = ${programId} LIMIT 1
      `;
      if (pRows[0]) {
        ctx.program_name = pRows[0].program_name;
        ctx.program_code = pRows[0].program_code;
        if (pRows[0].start_date) {
          ctx.start_date = new Date(pRows[0].start_date).toLocaleDateString('ar-SA');
        }
        if (pRows[0].end_date) {
          ctx.end_date = new Date(pRows[0].end_date).toLocaleDateString('ar-SA');
        }
      }
    }

    if (!ctx.deadline_date) {
      const deadline = new Date(Date.now() + 7 * 86400000);
      ctx.deadline_date = deadline.toLocaleDateString('ar-SA');
    }

    const renderedSubject = injectVars(t.subject || '', ctx);
    const renderedBody = injectVars(t.body_plain || '', ctx);
    const renderedHtml = injectVars(t.body_html || '', ctx);

    const subjectUnresolved = renderedSubject.match(/\{\{[^}]+\}\}/g) || [];
    const bodyUnresolved = renderedBody.match(/\{\{[^}]+\}\}/g) || [];
    const unresolved = [...new Set([...subjectUnresolved, ...bodyUnresolved])];

    return NextResponse.json({
      template_code: t.template_code,
      template_name: t.name_ar,
      subject: renderedSubject,
      body: renderedBody,
      body_html: renderedHtml,
      context_used: ctx,
      unresolved,
      requires_input: unresolved.length > 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'render_error', detail: e.message },
      { status: 500 }
    );
  }
}
