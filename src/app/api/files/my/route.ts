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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const scope = req.nextUrl.searchParams.get('scope');
  const userIsAdmin = await isAdmin(session.userId);
  const seeAll = scope === 'all' && userIsAdmin;

  const forumFiles = seeAll
    ? await db<any[]>`
        SELECT 'forum' AS source,
          a.id, a.file_name, a.storage_path, a.mime_type, a.size_bytes, a.uploaded_at,
          pg.id AS program_id, pg.title_ar AS program_title, pg.code AS program_code,
          u.email AS uploaded_by_email, COALESCE(u.name_ar, u.email) AS uploaded_by_name
        FROM program_forum_attachments a
        INNER JOIN program_forum_posts p ON p.id = a.post_id
        INNER JOIN ecosystem_programs pg ON pg.id = p.program_id
        LEFT JOIN users u ON u.id = a.uploaded_by
        ORDER BY a.uploaded_at DESC
      `
    : await db<any[]>`
        SELECT 'forum' AS source,
          a.id, a.file_name, a.storage_path, a.mime_type, a.size_bytes, a.uploaded_at,
          pg.id AS program_id, pg.title_ar AS program_title, pg.code AS program_code,
          NULL AS uploaded_by_email, NULL AS uploaded_by_name
        FROM program_forum_attachments a
        INNER JOIN program_forum_posts p ON p.id = a.post_id
        INNER JOIN ecosystem_programs pg ON pg.id = p.program_id
        WHERE a.uploaded_by = ${session.userId}::uuid
        ORDER BY a.uploaded_at DESC
      `;

  const importFiles = seeAll
    ? await db<any[]>`
        SELECT 'import' AS source,
          i.id, i.file_name, i.storage_path,
          'application/vnd.ms-excel' AS mime_type,
          NULL::bigint AS size_bytes,
          i.uploaded_at,
          pg.id AS program_id, pg.title_ar AS program_title, pg.code AS program_code,
          i.total_rows, i.inserted_rows, i.status,
          u.email AS uploaded_by_email, COALESCE(u.name_ar, u.email) AS uploaded_by_name
        FROM program_nominee_imports i
        INNER JOIN ecosystem_programs pg ON pg.id = i.program_id
        LEFT JOIN users u ON u.id = i.uploaded_by
        ORDER BY i.uploaded_at DESC
      `
    : await db<any[]>`
        SELECT 'import' AS source,
          i.id, i.file_name, i.storage_path,
          'application/vnd.ms-excel' AS mime_type,
          NULL::bigint AS size_bytes,
          i.uploaded_at,
          pg.id AS program_id, pg.title_ar AS program_title, pg.code AS program_code,
          i.total_rows, i.inserted_rows, i.status,
          NULL AS uploaded_by_email, NULL AS uploaded_by_name
        FROM program_nominee_imports i
        INNER JOIN ecosystem_programs pg ON pg.id = i.program_id
        WHERE i.uploaded_by = ${session.userId}::uuid
        ORDER BY i.uploaded_at DESC
      `;

  const normalize = (rows: any[], source: string) =>
    rows.map((r: any) => ({
      source,
      id: Number(r.id),
      file_name:     r.file_name     ?? r.fileName,
      storage_path:  r.storage_path  ?? r.storagePath,
      mime_type:     r.mime_type     ?? r.mimeType,
      size_bytes:    r.size_bytes != null ? Number(r.size_bytes) : (r.sizeBytes != null ? Number(r.sizeBytes) : null),
      uploaded_at:   r.uploaded_at   ?? r.uploadedAt,
      program_id:    Number(r.program_id ?? r.programId),
      program_title: r.program_title ?? r.programTitle,
      program_code:  r.program_code  ?? r.programCode,
      total_rows:    r.total_rows    ?? r.totalRows,
      inserted_rows: r.inserted_rows ?? r.insertedRows,
      status:        r.status,
      uploaded_by_email: r.uploaded_by_email ?? r.uploadedByEmail,
      uploaded_by_name:  r.uploaded_by_name  ?? r.uploadedByName,
    }));

  const all = [...normalize(forumFiles, "forum"), ...normalize(importFiles, "import")]
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

  return NextResponse.json({ ok: true, files: all, is_admin: userIsAdmin, scope: seeAll ? 'all' : 'mine' });
}
