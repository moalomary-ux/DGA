import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  const userRows = await db<{ name_ar:string; name_en:string; title_ar:string; email:string }[]>`
    SELECT name_ar, name_en, title_ar, email FROM users WHERE id = ${s.userId as string}::uuid
  `;
  const user = userRows[0] || {};
  
  const memberships = await db<{ tenant_id:string; role:string }[]>`
    SELECT tenant_id, role FROM memberships WHERE user_id = ${s.userId as string}::uuid AND status = 'active'
  `;
  
  let tasks: Record<string, unknown>[] = [];
  try {
    tasks = await db`
      SELECT id, title, description, status, priority, due_date, created_at
      FROM tasks WHERE assigned_to = ${s.userId as string}::uuid AND status != 'completed'
      ORDER BY due_date NULLS LAST LIMIT 10
    `;
  } catch {}
  
  let programs: Record<string, unknown>[] = [];
  try {
    programs = await db`
      SELECT id, code, title_ar, status, start_date FROM ecosystem_programs
      WHERE owner_id = ${s.userId as string}::uuid OR supporter_id = ${s.userId as string}::uuid
      ORDER BY start_date DESC LIMIT 5
    `;
  } catch {}
  
  return NextResponse.json({ ok:true, user, memberships, tasks, programs });
}
