import { db } from "@/lib/db";

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const EMBED_MODEL = process.env.RAG_EMBED_MODEL || 'nomic-embed-text';

export async function embed(text: string): Promise<number[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const isCloud = OLLAMA_HOST.includes('ollama.com');
  if (isCloud && OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
  const r = await fetch(`${OLLAMA_HOST}/api/embed`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!r.ok) throw new Error(`embed HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const vec = d.embeddings?.[0] || d.embedding;
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('embed: empty vector');
  return vec;
}

export function chunkText(text: string, maxChars = 1500, overlap = 200): string[] {
  text = (text || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const out: string[] = [];
  let s = 0;
  while (s < text.length) {
    let e = s + maxChars;
    if (e >= text.length) { out.push(text.slice(s)); break; }
    const back = text.slice(Math.max(0, e - 200), e);
    const dot = back.lastIndexOf('.');
    const nl = back.lastIndexOf('\n');
    const bp = Math.max(dot, nl);
    if (bp > 0) e = e - back.length + bp + 1;
    out.push(text.slice(s, e));
    s = Math.max(s + 1, e - overlap);
  }
  return out;
}

export async function ingestText(opts: {
  title: string; content: string;
  tenant_id?: string | null; owner_id?: string | null;
  source_type: string; source_path?: string | null;
  mime_type?: string | null; metadata?: any;
}): Promise<{ document_id: number; chunks: number }> {
  if (!opts.content?.trim()) throw new Error('content empty');
  const [doc] = await db<any[]>`
    INSERT INTO rag_documents (tenant_id, owner_id, source_type, source_path, title, mime_type, status, metadata)
    VALUES (${opts.tenant_id || null}, ${opts.owner_id || null}::uuid,
            ${opts.source_type}, ${opts.source_path || null}, ${opts.title},
            ${opts.mime_type || null}, 'processing',
            ${JSON.stringify(opts.metadata || {})}::jsonb)
    RETURNING id`;
  const docId = Number(doc.id);
  try {
    const chunks = chunkText(opts.content);
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const vec = await embed(ch);
      const vs = `[${vec.join(',')}]`;
      await db`INSERT INTO rag_chunks (document_id, chunk_index, content, content_tokens, embedding)
               VALUES (${docId}, ${i}, ${ch}, ${Math.ceil(ch.length / 4)}, ${vs}::vector)`;
    }
    await db`UPDATE rag_documents SET status='indexed', indexed_at=now(), updated_at=now() WHERE id=${docId}`;
    return { document_id: docId, chunks: chunks.length };
  } catch (e: any) {
    await db`UPDATE rag_documents SET status='failed',
             metadata=metadata || ${JSON.stringify({error: String(e?.message || e).slice(0, 500)})}::jsonb,
             updated_at=now() WHERE id=${docId}`;
    throw e;
  }
}

export async function searchDocuments(query: string, opts: {
  tenant_id?: string | null; limit?: number; min_similarity?: number;
} = {}): Promise<any[]> {
  if (!query?.trim()) return [];
  const qv = await embed(query);
  const vs = `[${qv.join(',')}]`;
  const lim = Math.min(opts.limit || 5, 20);
  const rows = opts.tenant_id
    ? await db<any[]>`
        SELECT c.id, c.document_id, c.chunk_index, c.content,
               d.title, d.source_type, d.source_path,
               (1 - (c.embedding <=> ${vs}::vector))::float AS similarity
        FROM rag_chunks c JOIN rag_documents d ON d.id = c.document_id
        WHERE d.status='indexed' AND d.tenant_id=${opts.tenant_id}
        ORDER BY c.embedding <=> ${vs}::vector LIMIT ${lim}`
    : await db<any[]>`
        SELECT c.id, c.document_id, c.chunk_index, c.content,
               d.title, d.source_type, d.source_path,
               (1 - (c.embedding <=> ${vs}::vector))::float AS similarity
        FROM rag_chunks c JOIN rag_documents d ON d.id = c.document_id
        WHERE d.status='indexed'
        ORDER BY c.embedding <=> ${vs}::vector LIMIT ${lim}`;
  return rows.filter((r: any) => Number(r.similarity) >= (opts.min_similarity ?? 0));
}
