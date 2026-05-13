import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TEXT_MIMES = ['text/', 'application/json', 'application/xml', 'application/javascript', 'application/x-yaml', 'application/x-sh'];
const TEXT_EXTS = ['.txt', '.md', '.csv', '.json', '.yml', '.yaml', '.xml', '.log', '.sql', '.js', '.ts', '.tsx', '.jsx', '.py', '.sh', '.bash', '.html', '.htm', '.css', '.scss', '.env', '.conf', '.ini', '.toml'];

function isTextLike(mime: string, name: string): boolean {
  if (TEXT_MIMES.some(m => mime.startsWith(m))) return true;
  return TEXT_EXTS.some(e => name.toLowerCase().endsWith(e));
}
function isXlsx(mime: string, name: string): boolean {
  return mime.includes('spreadsheetml') || mime.includes('ms-excel') || /\.(xlsx|xls)$/i.test(name);
}
function isDocx(mime: string, name: string): boolean {
  return mime.includes('wordprocessingml') || mime.includes('msword') || /\.docx?$/i.test(name);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid form data' }, { status: 400 }); }

  const file = formData.get('file') as File | null;
  const convIdRaw = formData.get('conversationId');
  const convId = convIdRaw ? Number(convIdRaw) : null;

  if (!file) return NextResponse.json({ ok: false, error: 'no file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: `الملف كبير. الحد ${MAX_BYTES/1024/1024}MB` }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ ok: false, error: 'ملف فارغ' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'application/octet-stream';
  const name = file.name || 'unnamed';

  let contentText: string | null = null;
  let storageB64: string | null = null;
  let preview: string;
  let extractionStatus: string;

  if (isTextLike(mime, name)) {
    try {
      contentText = buffer.toString('utf-8');
      preview = contentText.slice(0, 300);
      extractionStatus = 'text-extracted';
    } catch { preview = '[فشل قراءة]'; extractionStatus = 'text-failed'; }
  } else if (isXlsx(mime, name)) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) parts.push(`### ورقة: ${sheetName}\n${csv}`);
      }
      contentText = parts.length > 0 ? parts.join('\n\n') : '(Excel فارغ)';
      preview = contentText.slice(0, 300);
      extractionStatus = 'xlsx-extracted';
    } catch (e: any) {
      preview = `[فشل XLSX: ${(e?.message||'').slice(0,80)}]`;
      extractionStatus = 'xlsx-failed';
    }
  } else if (isDocx(mime, name)) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      contentText = result.value;
      preview = contentText.slice(0, 300);
      extractionStatus = 'docx-extracted';
    } catch (e: any) {
      preview = `[فشل DOCX: ${(e?.message||'').slice(0,80)}]`;
      extractionStatus = 'docx-failed';
    }
  } else if (mime.startsWith('image/') && file.size < 800 * 1024) {
    storageB64 = buffer.toString('base64');
    preview = '[صورة — اختر qwen3-vl من قائمة الموديلات لتحليلها]';
    extractionStatus = 'image-stored';
  } else if (mime === 'application/pdf') {
    preview = '[PDF — استخراج النص يحتاج Phase 3]';
    extractionStatus = 'pdf-not-extracted';
  } else {
    preview = `[ملف ثنائي - ${mime}]`;
    extractionStatus = 'binary';
  }

  const rows = await db<any[]>`
    INSERT INTO chat_attachments (user_id, conversation_id, filename, mime, size_bytes, content_text, storage_b64, metadata)
    VALUES (${session.userId}::uuid, ${convId}, ${name}, ${mime}, ${file.size}, ${contentText}, ${storageB64},
      ${JSON.stringify({ source: 'assistant-chat', extraction: extractionStatus })}::jsonb)
    RETURNING id, filename, mime, size_bytes
  `;

  return NextResponse.json({
    ok: true,
    file: {
      id: Number(rows[0].id), name: rows[0].filename, mime: rows[0].mime, size: rows[0].size_bytes,
      preview, has_text: contentText !== null, has_image: storageB64 !== null,
      content_length: contentText?.length || 0, status: extractionStatus,
    },
  });
}
