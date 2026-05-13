import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const steps: any[] = [];
  const programId = Number(new URL(req.url).searchParams.get("id") || 257);
  try {
    steps.push({ programId });
    const programs = await db`
      SELECT id, title_ar, code, kind, status, partner,
             TO_CHAR(start_date,'YYYY-MM-DD') AS start_date,
             TO_CHAR(end_date,'YYYY-MM-DD') AS end_date
      FROM ecosystem_programs WHERE id=${programId} LIMIT 1
    `;
    steps.push({ program_found: programs.length });
    
    const nominees = await db`
      SELECT n.id, n.name_ar, n.status, n.contact_id,
             COALESCE(n.email, c.primary_email) AS email,
             (SELECT COUNT(*)::int FROM ecosystem_attendances ea 
              WHERE ea.person_id = n.contact_id AND ea.program_id <> n.program_id) AS prior_programs
      FROM program_nominees n
      LEFT JOIN ecosystem_contacts c ON c.mac_kg_id = n.contact_id
      WHERE n.program_id=${programId} LIMIT 3
    `;
    steps.push({ nominees_found: nominees.length });
    
    const types: Record<string, string> = {};
    const sample = nominees[0];
    if (sample) for (const k of Object.keys(sample)) {
      const v = (sample as any)[k];
      types[k] = v === null ? "null" : v instanceof Date ? "Date" : typeof v;
    }
    return NextResponse.json({ ok: true, steps, types, program: programs[0], sample_nominee: sample });
  } catch (e: any) {
    return NextResponse.json({ ok: false, steps, error: e?.message, stack: e?.stack?.split('\n').slice(0, 10) }, { status: 500 });
  }
}
