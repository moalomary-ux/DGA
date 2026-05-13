import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ROLE_META: Record<string, { ar: string; color: string; icon: string }> = {
  owner:       { ar: 'مالك',  color: '#7C3AED', icon: '\u25C6' },
  supporter:   { ar: 'مساند', color: '#06B6D4', icon: '\u25C7' },
  coordinator: { ar: 'منسق',  color: '#F59E0B', icon: '\u25C8' },
  observer:    { ar: 'مراقب', color: '#94a3b8', icon: '\u25CB' },
  reviewer:    { ar: 'مراجع', color: '#10B981', icon: '\u2713' },
};

const STATUS_META: Record<string, { ar: string; color: string }> = {
  planned:     { ar: 'مخطّط',         color: '#94a3b8' },
  open:        { ar: 'مفتوح',         color: '#06B6D4' },
  in_progress: { ar: 'قيد التنفيذ',   color: '#F59E0B' },
  closed:      { ar: 'مغلق',          color: '#10B981' },
  cancelled:   { ar: 'ملغى',          color: '#EF4444' },
};

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const tasks = await db<any[]>`
    SELECT
      pa.id AS assignment_id,
      pa.role,
      pa.notes,
      pa.assigned_at,
      p.id AS program_id,
      p.code,
      p.title_ar,
      p.status,
      TO_CHAR(p.start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(p.end_date, 'YYYY-MM-DD') AS end_date,
      COALESCE(p.enrolled_count, 0) AS enrolled,
      COALESCE(p.capacity, 0) AS capacity
    FROM program_assignments pa
    JOIN ecosystem_programs p ON p.id = pa.program_id
    WHERE pa.user_id = ${session.userId}::uuid
    ORDER BY
      CASE p.status
        WHEN 'in_progress' THEN 1
        WHEN 'open' THEN 2
        WHEN 'planned' THEN 3
        WHEN 'closed' THEN 5
        ELSE 4
      END,
      p.end_date ASC NULLS LAST,
      pa.assigned_at DESC
  `;

  const decorated = tasks.map((t: any) => ({
    ...t,
    role_label: ROLE_META[t.role]?.ar || t.role,
    role_color: ROLE_META[t.role]?.color || '#94a3b8',
    role_icon:  ROLE_META[t.role]?.icon || '\u25C6',
    status_label: STATUS_META[t.status]?.ar || t.status,
    status_color: STATUS_META[t.status]?.color || '#94a3b8',
  }));

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  const stats = {
    total: decorated.length,
    active: decorated.filter((t: any) => ['open', 'in_progress'].includes(t.status)).length,
    upcoming: decorated.filter((t: any) => {
      if (!t.end_date || t.status === 'closed') return false;
      const due = new Date(t.end_date);
      return due >= now && due <= weekFromNow;
    }).length,
    overdue: decorated.filter((t: any) => {
      if (!t.end_date || t.status === 'closed') return false;
      return new Date(t.end_date) < now;
    }).length,
  };

  return NextResponse.json({ ok: true, tasks: decorated, stats });
}
