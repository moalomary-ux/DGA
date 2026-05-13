import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const steps: any[] = ["start"];
  try {
    steps.push("query");
    const programs = await db`
      SELECT p.id, p.title_ar, p.code, p.kind, p.status, p.partner,
             TO_CHAR(p.start_date,'YYYY-MM-DD') AS start_date,
             TO_CHAR(p.end_date,'YYYY-MM-DD') AS end_date,
             COUNT(n.id)::int AS total,
             COUNT(*) FILTER (WHERE n.status='submitted')::int AS submitted,
             COUNT(*) FILTER (WHERE n.status='attended')::int AS attended,
             COUNT(*) FILTER (WHERE n.status='accepted')::int AS accepted,
             COUNT(*) FILTER (WHERE n.status='rejected')::int AS rejected,
             COUNT(*) FILTER (WHERE n.status='waitlist')::int AS waitlist,
             COUNT(*) FILTER (WHERE n.status='under_review')::int AS under_review
      FROM ecosystem_programs p
      LEFT JOIN program_nominees n ON n.program_id=p.id
      GROUP BY p.id
      HAVING COUNT(n.id) > 0
      ORDER BY p.start_date DESC NULLS LAST, p.id DESC
      LIMIT 3
    `;
    steps.push({ rows: programs.length });
    const sample = programs[0];
    const types: Record<string, string> = {};
    if (sample) for (const k of Object.keys(sample)) {
      const v = (sample as any)[k];
      types[k] = v === null ? "null" : v instanceof Date ? "Date" : typeof v;
    }
    return NextResponse.json({ ok: true, steps, types, sample });
  } catch (e: any) {
    return NextResponse.json({ ok: false, steps, error: e?.message, stack: e?.stack?.split('\n').slice(0, 10) }, { status: 500 });
  }
}
