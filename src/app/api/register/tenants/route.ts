import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenants = await db`
    SELECT id, name_ar, domain FROM tenants 
    WHERE allows_registration = TRUE AND is_public = TRUE 
    ORDER BY id
  `;
  return NextResponse.json({ ok:true, tenants });
}
