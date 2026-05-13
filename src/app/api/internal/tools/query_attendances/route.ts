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
  const programId = args.program_id ? Number(args.program_id) : null;
  const personSearch = args.person_search ? String(args.person_search).trim() : null;
  const status = args.status || null;
  const limit = Math.min(Number(args.limit) || 50, 100);

  try {
    let rows: any[];
    // Build query based on filters
    if (programId && status) {
      rows = await db<any[]>`
        SELECT a.*, p.title_ar AS program_title, p.code AS program_code,
               c.name AS person_name, c.email AS person_email
        FROM ecosystem_attendances a
        LEFT JOIN ecosystem_programs p ON p.id = a.program_id
        LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
        WHERE a.program_id = ${programId} AND a.status = ${status}
        ORDER BY a.id DESC LIMIT ${limit}`;
    } else if (programId) {
      rows = await db<any[]>`
        SELECT a.*, p.title_ar AS program_title, p.code AS program_code,
               c.name AS person_name, c.email AS person_email
        FROM ecosystem_attendances a
        LEFT JOIN ecosystem_programs p ON p.id = a.program_id
        LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
        WHERE a.program_id = ${programId}
        ORDER BY a.id DESC LIMIT ${limit}`;
    } else if (personSearch) {
      const pattern = `%${personSearch}%`;
      rows = await db<any[]>`
        SELECT a.*, p.title_ar AS program_title, p.code AS program_code,
               c.name AS person_name, c.email AS person_email
        FROM ecosystem_attendances a
        LEFT JOIN ecosystem_programs p ON p.id = a.program_id
        LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
        WHERE c.name ILIKE ${pattern} OR c.email ILIKE ${pattern}
        ORDER BY a.id DESC LIMIT ${limit}`;
    } else if (status) {
      rows = await db<any[]>`
        SELECT a.*, p.title_ar AS program_title, p.code AS program_code,
               c.name AS person_name, c.email AS person_email
        FROM ecosystem_attendances a
        LEFT JOIN ecosystem_programs p ON p.id = a.program_id
        LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
        WHERE a.status = ${status}
        ORDER BY a.id DESC LIMIT ${limit}`;
    } else {
      rows = await db<any[]>`
        SELECT a.*, p.title_ar AS program_title, p.code AS program_code,
               c.name AS person_name, c.email AS person_email
        FROM ecosystem_attendances a
        LEFT JOIN ecosystem_programs p ON p.id = a.program_id
        LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = a.person_id
        ORDER BY a.id DESC LIMIT ${limit}`;
    }

    const attendances = rows.map(r => ({
      id: r.id,
      program_id: r.program_id,
      program_title: r.program_title,
      program_code: r.program_code,
      person_id: r.person_id,
      person_name: r.person_name,
      person_email: r.person_email,
      status: r.status,
      attended_at: r.attended_at || r.created_at,
    }));

    return NextResponse.json({ ok: true, count: attendances.length, attendances });
  } catch (e: any) {
    console.error("query_attendances error:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
