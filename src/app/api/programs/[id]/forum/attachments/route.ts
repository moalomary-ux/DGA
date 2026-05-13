import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await db<any[]>`
    SELECT a.id, a.post_id, a.file_name, a.storage_path, a.mime_type, a.size_bytes, a.uploaded_at
    FROM program_forum_attachments a
    INNER JOIN program_forum_posts p ON p.id = a.post_id
    WHERE p.program_id = ${Number(id)}
    ORDER BY a.uploaded_at DESC
  `;

  const byPost: Record<number, any[]> = {};
  rows.forEach((a: any) => {
    const pid = Number(a.post_id ?? a.postId);
    if (!byPost[pid]) byPost[pid] = [];
    byPost[pid].push({
      id: Number(a.id),
      file_name: a.file_name ?? a.fileName,
      storage_path: a.storage_path ?? a.storagePath,
      mime_type: a.mime_type ?? a.mimeType,
      size_bytes: Number(a.size_bytes ?? a.sizeBytes ?? 0),
    });
  });

  return NextResponse.json({ ok: true, byPost });
}
