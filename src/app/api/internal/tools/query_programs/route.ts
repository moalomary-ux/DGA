import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  if (!body.user_id) {
    return NextResponse.json({ ok: false, error: "missing user_id" }, { status: 400 });
  }
  const args = body.args || {};
  const status = args.status || null;
  const upcomingOnly = Boolean(args.upcoming_only);
  const limit = Math.min(Number(args.limit) || 20, 50);

  try {
    let rows: any[];
    if (status && upcomingOnly) {
      rows = await db<any[]>`
        SELECT id, code, title_ar, title_en, program_type, category, provider, partner,
               start_date, end_date, capacity, enrolled_count, status
        FROM ecosystem_programs
        WHERE status = ${status} AND start_date > now()
        ORDER BY start_date ASC NULLS LAST LIMIT ${limit}`;
    } else if (status) {
      rows = await db<any[]>`
        SELECT id, code, title_ar, title_en, program_type, category, provider, partner,
               start_date, end_date, capacity, enrolled_count, status
        FROM ecosystem_programs
        WHERE status = ${status}
        ORDER BY start_date DESC NULLS LAST LIMIT ${limit}`;
    } else if (upcomingOnly) {
      rows = await db<any[]>`
        SELECT id, code, title_ar, title_en, program_type, category, provider, partner,
               start_date, end_date, capacity, enrolled_count, status
        FROM ecosystem_programs
        WHERE start_date > now()
        ORDER BY start_date ASC NULLS LAST LIMIT ${limit}`;
    } else {
      rows = await db<any[]>`
        SELECT id, code, title_ar, title_en, program_type, category, provider, partner,
               start_date, end_date, capacity, enrolled_count, status
        FROM ecosystem_programs
        ORDER BY start_date DESC NULLS LAST LIMIT ${limit}`;
    }
    const programs = rows.map(r => ({
      id: r.id, code: r.code,
      title: r.title_ar || r.title_en,
      type: r.program_type, category: r.category,
      provider: r.provider, partner: r.partner,
      start_date: r.start_date, end_date: r.end_date,
      capacity: r.capacity, enrolled: r.enrolled_count,
      status: r.status,
    }));
    return NextResponse.json({
      ok: true, count: programs.length, programs,
      filters: { status, upcoming_only: upcomingOnly, limit }
    });
  } catch (e: any) {
    console.error("query_programs error:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
