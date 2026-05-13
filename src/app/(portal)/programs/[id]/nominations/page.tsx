import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NominationsClient from "./client";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  const { id } = await params;
  const programId = Number(id);
  if (!Number.isFinite(programId)) redirect("/programs");

  const programs = await db<any[]>`
    SELECT id, title_ar, code, kind, status, partner,
           TO_CHAR(start_date,'YYYY-MM-DD') AS start_date,
           TO_CHAR(end_date,'YYYY-MM-DD') AS end_date
    FROM ecosystem_programs WHERE id=${programId} LIMIT 1
  `;
  if (!programs.length) redirect("/programs");

  return <NominationsClient programId={programId} program={programs[0]} />;
}
