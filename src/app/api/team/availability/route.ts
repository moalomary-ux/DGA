import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const rows = await db<any[]>`SELECT role FROM memberships WHERE user_id = ${userId}::uuid`;
    return rows.some((r: any) => typeof r.role === 'string' && r.role.toLowerCase().includes('admin'));
  } catch {
    return false;
  }
}

function normalize(r: any) {
  return {
    id: Number(r.id),
    user_id: r.user_id ?? r.userId,
    status: r.status,
    start_date: r.start_date ?? r.startDate,
    end_date: r.end_date ?? r.endDate,
    note: r.note,
    name_ar: r.name_ar ?? r.nameAr,
    email: r.email,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const mode = req.nextUrl.searchParams.get("mode");

  if (mode === "admin") {
    if (!await isAdmin(session.userId)) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const users = await db<any[]>`
      SELECT id, email, COALESCE(name_ar, email) AS name_ar FROM users ORDER BY name_ar
    `;
    const recs = await db<any[]>`
      SELECT t.id, t.user_id, t.status, t.start_date, t.end_date, t.note,
        u.email, COALESCE(u.name_ar, u.email) AS name_ar
      FROM team_availability t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.end_date >= CURRENT_DATE - 30
      ORDER BY t.start_date DESC, t.id DESC
    `;
    return NextResponse.json({
      ok: true,
      users: users.map((u: any) => ({ id: u.id, email: u.email, name_ar: u.name_ar ?? u.nameAr })),
      records: recs.map(normalize),
    });
  }

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const rows = await db<any[]>`
    SELECT t.id, t.user_id, t.status, t.start_date, t.end_date, t.note,
      u.email, COALESCE(u.name_ar, u.email) AS name_ar
    FROM team_availability t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.start_date <= ${date}::date AND t.end_date >= ${date}::date
      AND t.status != 'available'
    ORDER BY t.status, u.email
  `;
  const records = rows.map(normalize);
  const counts = {
    remote:   records.filter(r => r.status === 'remote').length,
    leave:    records.filter(r => r.status === 'leave').length,
    external: records.filter(r => r.status === 'external').length,
  };
  return NextResponse.json({ ok: true, date, records, counts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ ok: false }, { status: 401 });
  if (!await isAdmin(session.userId)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const { user_id, status, start_date, end_date, note } = body;
  if (!user_id || !status || !start_date || !end_date) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!['available','remote','leave','external'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });
  }
  const [row] = await db<any[]>`
    INSERT INTO team_availability (user_id, status, start_date, end_date, note, created_by)
    VALUES (${user_id}::uuid, ${status}, ${start_date}::date, ${end_date}::date, ${note || null}, ${session.userId}::uuid)
    RETURNING id
  `;
  return NextResponse.json({ ok: true, id: Number(row.id) });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ ok: false }, { status: 401 });
  if (!await isAdmin(session.userId)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
  await db`DELETE FROM team_availability WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
