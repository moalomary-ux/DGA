import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const rows = await db`
    SELECT id, filename, mime_type, size_bytes, status, tags, uploaded_at, last_accessed_at, conversation_id,
      (extracted_text IS NOT NULL AND extracted_text != '') AS has_text,
      length(extracted_text) AS text_length
    FROM user_files
    WHERE user_id = ${s.userId as string}::uuid AND status != 'deleted'
    ORDER BY uploaded_at DESC LIMIT 200
  `;
  return NextResponse.json({ ok:true, files: rows });
}
