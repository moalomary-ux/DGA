import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.user_id) return NextResponse.json({ ok: false, error: "missing user_id" }, { status: 400 });

  const args = body.args || {};
  const status = args.status || null;
  const programId = args.program_id ? Number(args.program_id) : null;
  const limit = Math.min(Number(args.limit) || 50, 100);

  try {
    let rows: any[];
    if (status && programId) {
      rows = await db<any[]>`
        SELECT n.*, p.title_ar AS program_title, p.code AS program_code
        FROM program_nominees n
        LEFT JOIN ecosystem_programs p ON p.id = n.program_id
        WHERE n.status = ${status} AND n.program_id = ${programId}
        ORDER BY n.id DESC LIMIT ${limit}`;
    } else if (status) {
      rows = await db<any[]>`
        SELECT n.*, p.title_ar AS program_title, p.code AS program_code
        FROM program_nominees n
        LEFT JOIN ecosystem_programs p ON p.id = n.program_id
        WHERE n.status = ${status}
        ORDER BY n.id DESC LIMIT ${limit}`;
    } else if (programId) {
      rows = await db<any[]>`
        SELECT n.*, p.title_ar AS program_title, p.code AS program_code
        FROM program_nominees n
        LEFT JOIN ecosystem_programs p ON p.id = n.program_id
        WHERE n.program_id = ${programId}
        ORDER BY n.id DESC LIMIT ${limit}`;
    } else {
      rows = await db<any[]>`
        SELECT n.*, p.title_ar AS program_title, p.code AS program_code
        FROM program_nominees n
        LEFT JOIN ecosystem_programs p ON p.id = n.program_id
        ORDER BY n.id DESC LIMIT ${limit}`;
    }

    const nominations = rows.map(r => ({
      id: r.id,
      program_id: r.program_id,
      program_title: r.program_title,
      program_code: r.program_code,
      status: r.status,
      nominee_id: r.nominee_id || r.person_id || r.user_id,
      nominee_email: r.email || r.nominee_email,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, count: nominations.length, nominations });
  } catch (e: any) {
    console.error("query_nominations error:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
