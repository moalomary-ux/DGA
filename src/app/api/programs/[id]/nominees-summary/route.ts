import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const r = await db<any[]>`
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='submitted')::int    AS submitted,
      COUNT(*) FILTER (WHERE status='under_review')::int AS under_review,
      COUNT(*) FILTER (WHERE status='waitlist')::int     AS waitlist,
      COUNT(*) FILTER (WHERE status='accepted')::int     AS accepted,
      COUNT(*) FILTER (WHERE status='attended')::int     AS attended,
      COUNT(*) FILTER (WHERE status='rejected')::int     AS rejected
    FROM program_nominees WHERE program_id=${Number(id)}
  `;
  const s = await db<any[]>`SELECT nominations_open FROM ecosystem_programs WHERE id=${Number(id)}`;
  return NextResponse.json({ ok: true, ...r[0], nominations_open: s[0]?.nominations_open !== false });
}
