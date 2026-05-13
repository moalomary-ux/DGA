"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "";

async function notify(payload: any) {
  if (!BRIDGE_TOKEN) return;
  try {
    await fetch(`${BRIDGE_URL}/v1/notify/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) { console.error("[notify]", e); }
}

export async function createProgram(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: "unauthorized" };
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return { ok: false, error: "not admin" };

  const title_ar = String(formData.get("title_ar") || "").trim();
  if (!title_ar) return { ok: false, error: "عنوان البرنامج مطلوب" };

  const kind = String(formData.get("kind") || "local");
  let code = String(formData.get("code") || "").trim();
  const partner = String(formData.get("partner") || "") || null;
  const provider = String(formData.get("provider") || "") || null;
  const start_date = String(formData.get("start_date") || "") || null;
  const end_date = String(formData.get("end_date") || "") || null;
  const capacity = Number(formData.get("capacity")) || null;
  const delivery_mode = String(formData.get("delivery_mode") || "") || null;
  const category = String(formData.get("category") || "") || null;
  const description = String(formData.get("description") || "") || null;
  const status = String(formData.get("status") || "development");

  // Auto-generate code if empty
  if (!code) {
    const year = new Date().getFullYear();
    const prefix = `TR-${year}-`;
    const max = await db<{ last_num: number }[]>`
      SELECT COALESCE(MAX(SUBSTRING(code FROM ${prefix + '(\\d+)'})::int), 0) AS last_num
      FROM ecosystem_programs WHERE code LIKE ${prefix + '%'}
    `;
    code = `${prefix}${String((max[0]?.last_num || 0) + 1).padStart(3, "0")}`;
  }

  try {
    const inserted = await db<{ id: number }[]>`
      INSERT INTO ecosystem_programs
        (title_ar, code, kind, partner, provider, start_date, end_date,
         capacity, delivery_mode, category, description, status,
         created_by, created_at, updated_at)
      VALUES (${title_ar}, ${code}, ${kind}, ${partner}, ${provider},
              ${start_date}, ${end_date}, ${capacity}, ${delivery_mode}, ${category},
              ${description}, ${status},
              ${session.userId}::uuid, NOW(), NOW())
      RETURNING id
    `;
    const programId = inserted[0].id;
    
    console.log(`[program] created #${programId} (${code}) by ${session.userId}`);
    revalidatePath("/programs");
  } catch (e: any) {
    console.error("[createProgram]", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
  
  // After successful insert, redirect outside try/catch
  const newProgRows = await db<{ id: number }[]>`SELECT id FROM ecosystem_programs WHERE code=${code} ORDER BY id DESC LIMIT 1`;
  redirect(`/programs/${newProgRows[0].id}/assignments?fresh=1`);
}

export async function assignOwner(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: "unauthorized" };
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return { ok: false, error: "not admin" };

  const program_id = Number(formData.get("program_id"));
  const user_id = String(formData.get("user_id"));
  const role = String(formData.get("role") || "owner");
  const notes = String(formData.get("notes") || "") || null;

  if (!Number.isFinite(program_id) || !user_id) return { ok: false, error: "invalid input" };
  if (!["owner", "coordinator", "observer"].includes(role)) return { ok: false, error: "invalid role" };

  try {
    await db`
      INSERT INTO program_assignments (program_id, user_id, role, assigned_by, notes)
      VALUES (${program_id}, ${user_id}::uuid, ${role}, ${session.userId}::uuid, ${notes})
      ON CONFLICT (program_id, user_id, role) DO UPDATE
        SET assigned_by = EXCLUDED.assigned_by, assigned_at = NOW(), notes = EXCLUDED.notes
    `;

    // معلومات البرنامج + الموظف للتنبيه
    const info = await db<any[]>`
      SELECT p.title_ar, p.code, u.name_ar, u.email, u.telegram_chat_id
      FROM ecosystem_programs p, users u
      WHERE p.id=${program_id} AND u.id=${user_id}::uuid
    `;

    if (info.length) {
      const { title_ar, code, name_ar, email, telegram_chat_id } = info[0];
      
      const roleLabel = role === "owner" ? "مالك" : role === "coordinator" ? "منسّق" : "مراقب";

      // 1) in-app notification
      await db`
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (${user_id}::uuid, 'program_assigned',
                ${`تم إسنادك ${roleLabel} على برنامج`},
                ${`${title_ar}${code ? ` (${code})` : ""}`},
                ${`/programs/${program_id}`},
                ${db.json({ program_id, code, role })})
      `;

      // 2) Telegram (إذا متاح)
      if (telegram_chat_id) {
        notify({
          title: `🎯 برنامج جديد مُسنَد إليك`,
          message: `${name_ar}\n\nالبرنامج: ${title_ar}\nالكود: ${code || "—"}\nالدور: ${roleLabel}\n\nالرابط: https://qtech.help/programs/${program_id}`,
          chatId: telegram_chat_id,
        });
      }

      // 3) إخطار محمد
      notify({
        title: `📋 تم إسناد برنامج`,
        message: `${title_ar} (${code || program_id})\nإلى: ${name_ar} (${email})\nبدور: ${roleLabel}`,
      });

      console.log(`[program] #${program_id} assigned to ${user_id} as ${role}`);
    }

    revalidatePath(`/programs/${program_id}`);
    revalidatePath(`/programs/${program_id}/assignments`);
    revalidatePath("/personal");
    return { ok: true };
  } catch (e: any) {
    console.error("[assignOwner]", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function removeAssignment(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: "unauthorized" };
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return { ok: false, error: "not admin" };

  const assignment_id = Number(formData.get("assignment_id"));
  const program_id = Number(formData.get("program_id"));
  if (!Number.isFinite(assignment_id)) return { ok: false, error: "invalid id" };

  await db`DELETE FROM program_assignments WHERE id=${assignment_id}`;
  revalidatePath(`/programs/${program_id}/assignments`);
  return { ok: true };
}
