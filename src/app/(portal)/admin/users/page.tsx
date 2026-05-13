import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import UsersClient from "./client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) redirect("/");

  const users = await db<any[]>`
    SELECT u.id, u.email, u.name_ar, u.name_en, u.title_ar, u.department,
           u.position, u.phone, u.status, u.is_active, u.telegram_chat_id,
           u.created_at, u.last_login_at,
           COALESCE(json_agg(json_build_object('tenant_id', m.tenant_id, 'role', m.role, 'status', m.status))
                    FILTER (WHERE m.tenant_id IS NOT NULL), '[]'::json) AS memberships
    FROM users u
    LEFT JOIN memberships m ON m.user_id=u.id
    GROUP BY u.id
    ORDER BY u.name_ar
  `;

  return <UsersClient users={users} isSuperAdmin={admin.isSuperAdmin} currentUserId={session.userId as string} />;
}
