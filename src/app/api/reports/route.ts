import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Each query in try/catch — لو فشل واحد، الباقي يكمل
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch (e) { console.warn("reports query failed:", e); return fallback; }
  };

  const totals = await safe(async () => {
    const r = await db<{ programs: number; people: number; attendances: number; completed: number }[]>`
      SELECT
        (SELECT COUNT(*)::int FROM ecosystem_programs) AS programs,
        (SELECT COUNT(*)::int FROM ecosystem_contacts) AS people,
        (SELECT COUNT(*)::int FROM ecosystem_attendances) AS attendances,
        (SELECT COUNT(*)::int FROM ecosystem_attendances WHERE completed = TRUE) AS completed
    `;
    return r[0];
  }, { programs: 0, people: 0, attendances: 0, completed: 0 });

  const byType = await safe(() => db<{ program_type: string; cnt: number }[]>`
    SELECT COALESCE(program_type, 'local') AS program_type, COUNT(*)::int AS cnt
    FROM ecosystem_programs GROUP BY program_type ORDER BY cnt DESC
  `, []);

  const byYear = await safe(() => db<{ yr: number; cnt: number }[]>`
    SELECT EXTRACT(YEAR FROM start_date)::int AS yr, COUNT(*)::int AS cnt
    FROM ecosystem_programs WHERE start_date IS NOT NULL
    GROUP BY yr ORDER BY yr DESC LIMIT 10
  `, []);

  const byCategory = await safe(() => db<{ category: string; cnt: number }[]>`
    SELECT COALESCE(category, 'متنوع') AS category, COUNT(*)::int AS cnt
    FROM ecosystem_programs GROUP BY category ORDER BY cnt DESC LIMIT 10
  `, []);

  const topPrograms = await safe(() => db<{ id: number; title_ar: string; code: string; cnt: number; program_type: string }[]>`
    SELECT
      p.id, p.title_ar, p.code, COALESCE(p.program_type, 'local') AS program_type,
      (SELECT COUNT(*)::int FROM ecosystem_attendances a WHERE a.program_id = p.id) AS cnt
    FROM ecosystem_programs p
    ORDER BY cnt DESC LIMIT 10
  `, []);

  // Top orgs — direct from contacts.organization_ar (no broken JOIN)
  const topOrgs = await safe(() => db<{ name: string; cnt: number }[]>`
    SELECT organization_ar AS name, COUNT(*)::int AS cnt
    FROM ecosystem_contacts WHERE organization_ar IS NOT NULL AND organization_ar != ''
    GROUP BY organization_ar ORDER BY cnt DESC LIMIT 8
  `, []);

  return NextResponse.json({ ok: true, totals, byType, byYear, byCategory, topOrgs, topPrograms });
}
