import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const postId = fd.get("postId") as string | null;
  const body = (fd.get("body") as string) || "";
  if (!file) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  
  const dir = "/app/public/uploads/forum";
  await mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
  const filePath = path.join(dir, safeName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  const publicPath = `/uploads/forum/${safeName}`;
  
  let actualPostId = postId ? Number(postId) : null;
  if (!actualPostId) {
    const [p] = await db<any[]>`
      INSERT INTO program_forum_posts (program_id, user_id, body, tag)
      VALUES (${Number(id)}, ${session.userId}, ${body || ''}, 'info')
      RETURNING id
    `;
    actualPostId = Number(p.id);
  }
  
  await db`
    INSERT INTO program_forum_attachments (post_id, file_name, storage_path, mime_type, size_bytes, uploaded_by)
    VALUES (${actualPostId}, ${file.name}, ${publicPath}, ${file.type}, ${file.size}, ${session.userId})
  `;
  
  return NextResponse.json({ ok: true, postId: actualPostId, url: publicPath });
}
