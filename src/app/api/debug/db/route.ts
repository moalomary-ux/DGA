import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r1 = await db`SELECT NOW() AS now, current_database() AS db`;
    const r2 = await db`SELECT COUNT(*)::int AS n FROM ecosystem_programs`;
    const r3 = await db`SELECT COUNT(*)::int AS n FROM program_nominees`;
    const r4 = await db`SELECT status, COUNT(*)::int AS n FROM program_nominees GROUP BY status`;
    return NextResponse.json({ ok: true, basic: r1[0], programs_count: r2[0].n, nominees_count: r3[0].n, by_status: r4 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message, stack: e?.stack?.split('\n').slice(0, 8) }, { status: 500 });
  }
}
