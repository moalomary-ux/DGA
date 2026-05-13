import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // KPIs — relaxed filters, count what we have
  const kpis = await db<{ active: number; total_attendees: number; pending: number; avg_completion: number }[]>`
    SELECT
      (SELECT COUNT(*)::int FROM ecosystem_programs 
        WHERE start_date IS NOT NULL 
          AND start_date BETWEEN CURRENT_DATE - INTERVAL '365 days' AND CURRENT_DATE + INTERVAL '180 days') AS active,
      (SELECT COUNT(*)::int FROM ecosystem_attendances) AS total_attendees,
      (SELECT COUNT(*)::int FROM ecosystem_attendances WHERE completed = FALSE) AS pending,
      (SELECT COALESCE(AVG(
         CASE WHEN capacity > 0 THEN LEAST(100, (enrolled_count::numeric / capacity * 100)) ELSE 0 END
       ), 0)::int FROM ecosystem_programs 
        WHERE start_date IS NOT NULL) AS avg_completion
  `;

  // Programs: top by attendees (relaxed — show data even if dates are old)
  const programs = await db`
    SELECT 
      p.id, p.code, p.title_ar, p.status, p.capacity, p.enrolled_count, p.start_date, p.category, p.program_type,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS attendees
    FROM ecosystem_programs p
    ORDER BY 
      CASE 
        WHEN start_date <= CURRENT_DATE AND COALESCE(end_date, start_date) >= CURRENT_DATE THEN 0
        WHEN start_date > CURRENT_DATE THEN 1
        ELSE 2
      END,
      attendees DESC,
      start_date DESC NULLS LAST
    LIMIT 8
  `;

  // Live program
  const liveResult = await db`
    SELECT id, code, title_ar, provider, start_date, end_date, capacity, enrolled_count
    FROM ecosystem_programs
    WHERE start_date <= CURRENT_DATE AND COALESCE(end_date, start_date) >= CURRENT_DATE
    ORDER BY start_date DESC LIMIT 1
  `;

  // Tasks
  type Task = { id: string; title: string; due: string; priority: string; program: string | null; done: boolean };
  let tasks: Task[] = [];
  try {
    tasks = await db<Task[]>`
      SELECT 
        item_id::text AS id, item_name AS title,
        COALESCE(due_date::text, 'بدون موعد') AS due,
        COALESCE(priority, 'medium') AS priority,
        board_name AS program, FALSE AS done
      FROM monday_items
      WHERE (status IS NULL OR status NOT IN ('Done', 'مكتمل', 'مغلق'))
      ORDER BY due_date ASC NULLS LAST LIMIT 5
    `;
  } catch {}

  return NextResponse.json({
    ok: true,
    kpis: {
      active: kpis[0]?.active || 0,
      total_attendees: kpis[0]?.total_attendees || 0,
      pending: kpis[0]?.pending || 0,
      avg_completion: kpis[0]?.avg_completion || 0,
    },
    programs,
    live: liveResult[0] || null,
    tasks,
  });
}
