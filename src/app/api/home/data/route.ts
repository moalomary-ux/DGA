import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // برامجي — أحدث 3 بأكثر حضور (بدلاً من الفلتر الزمني الضيّق)
  const myPrograms = await db`
    SELECT 
      p.id, p.title_ar, p.code, p.program_type, p.category, p.provider,
      p.start_date, p.end_date, p.capacity, p.enrolled_count, p.rating, p.status, p.delivery_mode,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS attendees
    FROM ecosystem_programs p
    ORDER BY 
      CASE WHEN p.start_date BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE + INTERVAL '60 days' THEN 0 ELSE 1 END,
      attendees DESC,
      p.start_date DESC NULLS LAST
    LIMIT 3
  `;

  // البرامج القادمة
  let upcoming: Record<string, unknown>[] = await db`
    SELECT id, title_ar, code, start_date, provider, category
    FROM ecosystem_programs
    WHERE start_date > CURRENT_DATE
    ORDER BY start_date ASC
    LIMIT 5
  `;
  // لو ما فيه قادمة، أظهر آخر برامج كانت نشطة
  if (upcoming.length === 0) {
    upcoming = await db`
      SELECT id, title_ar, code, start_date, provider, category
      FROM ecosystem_programs
      WHERE start_date IS NOT NULL
      ORDER BY start_date DESC
      LIMIT 5
    `;
  }

  // الترشيحات المعلّقة
  let pendingNominations = 0;
  try {
    const r = await db<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM ecosystem_attendances WHERE completed = FALSE
    `;
    pendingNominations = r[0]?.count || 0;
  } catch {}

  // مهام Monday
  type Task = { id: string; title: string; due: string; priority: string; program: string | null; done: boolean };
  let myTasks: Task[] = [];
  try {
    myTasks = await db<Task[]>`
      SELECT 
        item_id::text AS id, item_name AS title,
        COALESCE(due_date::text, 'بدون موعد') AS due,
        COALESCE(priority, 'medium') AS priority,
        board_name AS program, FALSE AS done
      FROM monday_items
      WHERE (status IS NULL OR status NOT IN ('Done', 'مكتمل', 'مغلق', 'Done ✓'))
      ORDER BY due_date ASC NULLS LAST
      LIMIT 6
    `;
  } catch {}

  // إحصائيات
  const stats = await db<{ programs: number; orgs: number; people: number }[]>`
    SELECT 
      (SELECT COUNT(*)::int FROM ecosystem_programs) AS programs,
      (SELECT COUNT(*)::int FROM ecosystem_organizations) AS orgs,
      (SELECT COUNT(*)::int FROM ecosystem_contacts WHERE is_active = TRUE) AS people
  `;

  return NextResponse.json({
    ok: true,
    user: { name: 'محمد العُمري', initials: 'م.ع', email: 'mohammed@omary.cloud' },
    myPrograms,
    upcoming,
    myTasks,
    stats: {
      programs_count: myPrograms.length,
      tasks_count: myTasks.length,
      pending_nominations: pendingNominations,
      inbox_count: 12,
      total_programs: stats[0]?.programs || 0,
      total_orgs: stats[0]?.orgs || 0,
      total_people: stats[0]?.people || 0,
    },
  });
}