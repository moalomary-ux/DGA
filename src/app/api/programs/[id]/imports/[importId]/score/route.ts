import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const BRIDGE_URL = process.env.BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string, importId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const { id, importId } = await ctx.params;
  
  const [program] = await db<any[]>`SELECT title_ar, description FROM ecosystem_programs WHERE id=${Number(id)}`;
  if (!program) return NextResponse.json({ ok: false, error: "program_not_found" }, { status: 404 });
  
  const nominees = await db<any[]>`
    SELECT id, name_ar, job_title, organization_ar FROM program_nominees
    WHERE import_id=${Number(importId)} AND ai_score IS NULL LIMIT 50
  `;
  if (!nominees.length) return NextResponse.json({ ok: true, scored: 0 });
  
  await db`UPDATE program_nominee_imports SET status='ai_scoring' WHERE id=${Number(importId)}`;
  
  let scored = 0;
  for (const n of nominees) {
    try {
      const prompt = `قيّم ملاءمة مرشّح لبرنامج تدريبي. أعطِ JSON فقط.

البرنامج: ${program.title_ar}
الوصف: ${program.description || "—"}

المرشح: ${n.name_ar || "—"} | المسمى: ${n.job_title || "—"} | الجهة: ${n.organization_ar || "—"}

أجب JSON: {"score": <1-10>, "reasoning": "<سبب موجز عربي>"}`;
      
      const res = await fetch(`${BRIDGE_URL}/v1/llm/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${BRIDGE_TOKEN}` },
        body: JSON.stringify({ model: "qwen3.5:397b", prompt, max_tokens: 250 }),
        signal: AbortSignal.timeout(15000),
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.response || data.text || JSON.stringify(data);
      const m = text.match(/"score"\s*:\s*(\d+)[^}]*"reasoning"\s*:\s*"([^"]+)"/);
      if (m) {
        const score = parseInt(m[1]);
        const reasoning = m[2];
        const newStatus = score >= 8 ? "under_review" : score >= 5 ? "waitlist" : "rejected";
        await db`UPDATE program_nominees SET ai_score=${score}, ai_reasoning=${reasoning}, status=${newStatus}, status_reason=${score < 5 ? reasoning : null} WHERE id=${n.id}`;
        scored++;
      }
    } catch (e) { console.error("AI:", e); }
  }
  
  await db`UPDATE program_nominee_imports SET status='done', ai_scored=ai_scored + ${scored} WHERE id=${Number(importId)}`;
  return NextResponse.json({ ok: true, scored });
}
