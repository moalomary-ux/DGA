import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const posts = await db<any[]>`
    SELECT p.id, p.parent_id, p.body, p.tag, p.created_at, p.user_id,
           u.name_ar, u.email
    FROM program_forum_posts p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.program_id=${Number(id)} AND p.deleted_at IS NULL
    ORDER BY p.created_at ASC LIMIT 500
  `;
  return NextResponse.json({ ok: true, posts, current_user_id: session.userId });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  if (!body.body?.trim()) return NextResponse.json({ ok: false, error: "النص مطلوب" }, { status: 400 });
  const r = await db<any[]>`
    INSERT INTO program_forum_posts (program_id, user_id, parent_id, body, tag)
    VALUES (${Number(id)}, ${session.userId}::uuid, ${body.parent_id || null}, ${body.body}, ${body.tag || null})
    RETURNING id
  `;
  return NextResponse.json({ ok: true, id: r[0].id });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const postId = Number(new URL(req.url).searchParams.get("postId"));
  if (!postId) return NextResponse.json({ ok: false }, { status: 400 });
  await db`UPDATE program_forum_posts SET deleted_at=NOW() WHERE id=${postId} AND (user_id=${session.userId}::uuid)`;
  return NextResponse.json({ ok: true });
}
