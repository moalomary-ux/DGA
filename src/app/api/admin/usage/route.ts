import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const admin = await checkAdmin(s.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok:false }, { status:403 });
  
  try {
    const today = await db<{ total:number; users:number; tokens:number }[]>`
      SELECT COUNT(*)::int AS total, COUNT(DISTINCT user_id)::int AS users, COALESCE(SUM(tokens_out),0)::int AS tokens
      FROM ai_usage_log WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;
    const week = await db<{ total:number; users:number; tokens:number }[]>`
      SELECT COUNT(*)::int AS total, COUNT(DISTINCT user_id)::int AS users, COALESCE(SUM(tokens_out),0)::int AS tokens
      FROM ai_usage_log WHERE created_at >= NOW() - INTERVAL '7 days'
    `;
    const month = await db<{ total:number; users:number; tokens:number }[]>`
      SELECT COUNT(*)::int AS total, COUNT(DISTINCT user_id)::int AS users, COALESCE(SUM(tokens_out),0)::int AS tokens
      FROM ai_usage_log WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    
    const byUser = await db`
      SELECT u.name_ar, u.email, COUNT(*)::int AS calls, COALESCE(SUM(l.tokens_out),0)::int AS tokens
      FROM ai_usage_log l LEFT JOIN users u ON u.id = l.user_id
      WHERE l.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.name_ar, u.email ORDER BY tokens DESC LIMIT 20
    `;
    
    const byModel = await db`
      SELECT model, COUNT(*)::int AS calls, COALESCE(SUM(tokens_out),0)::int AS tokens
      FROM ai_usage_log WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY model ORDER BY tokens DESC
    `;
    
    const daily = await db`
      SELECT DATE(created_at)::text AS day, COUNT(*)::int AS calls, COALESCE(SUM(tokens_out),0)::int AS tokens
      FROM ai_usage_log WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY day ORDER BY day ASC
    `;
    
    return NextResponse.json({
      ok: true,
      today: today[0], week: week[0], month: month[0],
      byUser, byModel, daily,
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error: String(e) }, { status: 500 });
  }
}
