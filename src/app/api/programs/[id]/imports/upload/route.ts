import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseExcelBuffer, normalizePhone, normalizeArabicName, normalizeOrgName } from "@/lib/excelParser";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  
  const { id } = await ctx.params;
  const programId = Number(id);
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  
  const dir = "/app/public/uploads/imports";
  await mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);
  const publicPath = `/uploads/imports/${safeName}`;
  
  const [imp] = await db<any[]>`
    INSERT INTO program_nominee_imports (program_id, file_name, storage_path, uploaded_by, status)
    VALUES (${programId}, ${file.name}, ${publicPath}, ${session.userId}, 'parsing')
    RETURNING id
  `;
  const importId = Number(imp.id);
  
  try {
    const rows = parseExcelBuffer(buffer);
    let matched = 0, inserted = 0, prevAttended = 0, orgMatched = 0;
    const mB = { email: 0, phone: 0, national_id: 0, name: 0 };
    const dB = { email: 0, phone: 0, national_id: 0, contact: 0, name: 0 };
    
    for (const r of rows) {
      const normPhone = normalizePhone(r.phone);
      const normName = normalizeArabicName(r.name);
      
      // ── KG matching (person) ──
      let contactId: number | null = null;
      if (r.email) {
        const c = await db<any[]>`SELECT mac_kg_id FROM ecosystem_contacts WHERE LOWER(primary_email)=LOWER(${r.email}) LIMIT 1`;
        if (c.length) { contactId = (c[0].mac_kg_id ?? (c[0] as any).macKgId) as number; matched++; mB.email++; }
      }
      if (!contactId && normPhone && normPhone.length >= 7) {
        const c = await db<any[]>`SELECT mac_kg_id FROM ecosystem_contacts WHERE REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE ${'%' + normPhone} LIMIT 1`;
        if (c.length) { contactId = (c[0].mac_kg_id ?? (c[0] as any).macKgId) as number; matched++; mB.phone++; }
      }
      if (!contactId && r.nationalId) {
        const c = await db<any[]>`SELECT mac_kg_id FROM ecosystem_contacts WHERE national_id=${r.nationalId} LIMIT 1`;
        if (c.length) { contactId = (c[0].mac_kg_id ?? (c[0] as any).macKgId) as number; matched++; mB.national_id++; }
      }
      if (!contactId && normName && normName.length >= 4) {
        const fw = normName.split(" ")[0];
        if (fw.length >= 3) {
          const cands = await db<any[]>`SELECT mac_kg_id, full_name_ar FROM ecosystem_contacts WHERE full_name_ar ILIKE ${fw + '%'} LIMIT 30`;
          for (const c of cands) {
            if (normalizeArabicName(c.full_name_ar) === normName) {
              contactId = (c.mac_kg_id ?? (c as any).macKgId) as number; matched++; mB.name++; break;
            }
          }
        }
      }
      
      // ── Organization matching (4 signals) ──
      let orgId: number | null = null;
      
      // 1) Use KG contact's org (most reliable)
      if (contactId) {
        const c = await db<any[]>`SELECT organization_id FROM ecosystem_contacts WHERE mac_kg_id=${contactId} AND organization_id IS NOT NULL LIMIT 1`;
        if (c.length && (c[0].organization_id ?? (c[0] as any).organizationId)) { orgId = Number(c[0].organization_id ?? (c[0] as any).organizationId); orgMatched++; }
      }
      // 2) Email domain
      if (!orgId && r.email) {
        const dom = r.email.split("@")[1]?.toLowerCase().trim();
        if (dom) {
          const o = await db<any[]>`SELECT id FROM ecosystem_organizations WHERE LOWER(TRIM(domain))=${dom} LIMIT 1`;
          if (o.length) { orgId = o[0].id; orgMatched++; }
        }
      }
      // 3) Exact name (case-insensitive trim)
      if (!orgId && r.organization) {
        const o = await db<any[]>`
          SELECT id FROM ecosystem_organizations 
          WHERE LOWER(TRIM(name_ar))=LOWER(TRIM(${r.organization})) 
             OR LOWER(TRIM(COALESCE(name_en,'')))=LOWER(TRIM(${r.organization}))
          LIMIT 1
        `;
        if (o.length) { orgId = o[0].id; orgMatched++; }
      }
      // 4) Fuzzy normalized
      if (!orgId && r.organization) {
        const orgN = normalizeOrgName(r.organization);
        if (orgN.length >= 3) {
          const fw = orgN.split(" ")[0];
          const cands = await db<any[]>`SELECT id, name_ar FROM ecosystem_organizations WHERE name_ar ILIKE ${'%' + fw + '%'} LIMIT 50`;
          for (const c of cands) {
            const dbN = normalizeOrgName(c.name_ar);
            if (dbN === orgN || (dbN.length > 3 && orgN.length > 3 && (dbN.includes(orgN) || orgN.includes(dbN)))) {
              orgId = c.id; orgMatched++; break;
            }
          }
        }
      }
      
      // ── Dedup ──
      let dup: string | null = null;
      if (r.email) {
        const d = await db<any[]>`SELECT id FROM program_nominees WHERE program_id=${programId} AND LOWER(email)=LOWER(${r.email}) LIMIT 1`;
        if (d.length) dup = "email";
      }
      if (!dup && normPhone && normPhone.length >= 7) {
        const d = await db<any[]>`SELECT id FROM program_nominees WHERE program_id=${programId} AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE ${'%' + normPhone} LIMIT 1`;
        if (d.length) dup = "phone";
      }
      if (!dup && r.nationalId) {
        const d = await db<any[]>`SELECT id FROM program_nominees WHERE program_id=${programId} AND national_id=${r.nationalId} LIMIT 1`;
        if (d.length) dup = "national_id";
      }
      if (!dup && contactId) {
        const d = await db<any[]>`SELECT id FROM program_nominees WHERE program_id=${programId} AND contact_id=${contactId} LIMIT 1`;
        if (d.length) dup = "contact";
      }
      if (!dup && normName && normName.length >= 4) {
        const fw = normName.split(" ")[0];
        if (fw.length >= 3) {
          const cands = await db<any[]>`SELECT id, name_ar FROM program_nominees WHERE program_id=${programId} AND name_ar ILIKE ${fw + '%'} LIMIT 30`;
          for (const c of cands) {
            if (normalizeArabicName(c.name_ar) === normName) { dup = "name"; break; }
          }
        }
      }
      if (dup) { (dB as any)[dup]++; continue; }
      
      // ── Previous involvement check (BUSINESS RULE) ──
      // "Previously trained" = has actual attendance OR is in another program with active status
      let prevCount = 0;
      if (contactId) {
        const r1 = await db<any[]>`
          SELECT COUNT(DISTINCT program_id)::int AS cnt FROM (
            SELECT program_id FROM ecosystem_attendances WHERE person_id=${contactId} AND program_id <> ${programId}
            UNION
            SELECT program_id FROM program_nominees 
            WHERE contact_id=${contactId} AND program_id <> ${programId} 
              AND status IN ('accepted','attended','submitted','under_review','waitlist')
          ) src
        `;
        prevCount = Number(r1[0]?.cnt || 0);
      }
      
      let status = "submitted";
      let statusReason: string | null = null;
      if (prevCount > 0) {
        status = "rejected";
        statusReason = `سبق له حضور ${prevCount} برنامج تدريبي — يحتاج استثناء صريح`;
        prevAttended++;
      }
      
      await db`
        INSERT INTO program_nominees (
          program_id, contact_id, name_ar, email, phone, job_title, organization_ar, organization_id, national_id,
          source, raw_data, import_id, status, status_reason, previous_attendance_count
        ) VALUES (
          ${programId}, ${contactId}, ${r.name || null}, ${r.email || null}, ${r.phone || null},
          ${r.jobTitle || null}, ${r.organization || null}, ${orgId}, ${r.nationalId || null},
          'excel_upload', ${JSON.stringify(r.raw)}, ${importId}, ${status}, ${statusReason}, ${prevCount}
        )
      `;
      inserted++;
    }
    
    const duplicates = dB.email + dB.phone + dB.national_id + dB.contact + dB.name;
    await db`
      UPDATE program_nominee_imports 
      SET status='done', total_rows=${rows.length}, inserted_rows=${inserted},
          matched_rows=${matched}, duplicate_rows=${duplicates}, completed_at=NOW()
      WHERE id=${importId}
    `;
    
    return NextResponse.json({
      ok: true, importId, total: rows.length, inserted, matched, duplicates,
      prevAttended, orgMatched,
      matchBreakdown: mB, dupBreakdown: dB,
    });
  } catch (err: any) {
    await db`UPDATE program_nominee_imports SET status='error', error_msg=${err.message} WHERE id=${importId}`;
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
