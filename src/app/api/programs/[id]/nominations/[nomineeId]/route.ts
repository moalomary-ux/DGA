import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; nomineeId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id, nomineeId } = await ctx.params;
  const nId = Number(nomineeId);
  if (!Number.isFinite(nId)) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const { status, status_reason } = body;
  
  const validStatus = ['submitted','under_review','accepted','rejected','waitlist','attended'];
  if (status && !validStatus.includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  try {
    await db`
      UPDATE program_nominees
      SET status = COALESCE(${status || null}, status),
          status_reason = COALESCE(${status_reason || null}, status_reason),
          decided_by = ${session.userId}::uuid,
          decided_at = NOW(),
          updated_at = NOW()
      WHERE id = ${nId} AND program_id = ${Number(id)}
    `;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[nominee PATCH]", e);
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; nomineeId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id, nomineeId } = await ctx.params;
  const nId = Number(nomineeId);
  if (!Number.isFinite(nId)) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

  await db`DELETE FROM program_nominees WHERE id=${nId} AND program_id=${Number(id)} AND source='manual'`;
  return NextResponse.json({ ok: true });
}
