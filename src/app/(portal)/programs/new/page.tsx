import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createProgram } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) redirect("/programs");

  return (
    <div style={{ padding: 24, maxWidth: 880, margin: "0 auto" }} dir="rtl">
      <Link href="/programs" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>← البرامج</Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: "8px 0 4px" }}>برنامج جديد</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
        بعد الحفظ، ستنتقل لشاشة اختيار الموظف المالك للبرنامج.
      </p>

      <form action={createProgram} style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 24 }}>
        
        <Section title="المعلومات الأساسية">
          <Row>
            <Field name="title_ar" label="اسم البرنامج بالعربي *" required style={{ flex: 2 }} />
            <Field name="code" label="الكود (اختياري — يُولَّد تلقائياً)" placeholder="TR-2026-XXX" style={{ flex: 1 }} mono />
          </Row>
          <Row>
            <SelectField name="kind" label="النوع *" options={[
              { value: "international", label: "🟣 دولي" },
              { value: "local", label: "🟢 محلي" },
              { value: "workshop", label: "🟠 ورشة عمل" },
              { value: "seminar", label: "🔵 ندوة معرفية" },
              { value: "closed", label: "⚫ مغلق" },
            ]} defaultValue="local" />
            <SelectField name="status" label="الحالة" options={[
              { value: "development", label: "قيد البناء" },
              { value: "ideation", label: "أفكار" },
              { value: "review", label: "تحت المراجعة" },
              { value: "registration", label: "فتح التسجيل" },
            ]} defaultValue="development" />
          </Row>
          <Field name="description" label="الوصف" textarea rows={3} />
        </Section>

        <Section title="الشراكات والتواريخ">
          <Row>
            <Field name="partner" label="الشريك" placeholder="مثال: SAS, IBM, Cisco" />
            <Field name="provider" label="الجهة المنفّذة" />
          </Row>
          <Row>
            <Field name="start_date" label="تاريخ البدء" type="date" />
            <Field name="end_date" label="تاريخ الانتهاء" type="date" />
          </Row>
        </Section>

        <Section title="التفاصيل اللوجستية">
          <Row>
            <Field name="capacity" label="السعة (عدد المقاعد)" type="number" placeholder="مثال: 30" />
            <SelectField name="delivery_mode" label="نمط التقديم" options={[
              { value: "", label: "—" },
              { value: "in_person", label: "حضوري" },
              { value: "online", label: "عن بُعد" },
              { value: "hybrid", label: "مدمج" },
            ]} />
            <Field name="category" label="التصنيف" placeholder="مثال: حوكمة، حوسبة سحابية" />
          </Row>
        </Section>

        <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #1f2937" }}>
          <button type="submit" style={{ padding: "10px 24px", background: "#00ABAF", color: "#fff", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            حفظ والانتقال للإسناد →
          </button>
          <Link href="/programs" style={{ padding: "10px 24px", background: "transparent", color: "#94a3b8", border: "1px solid #2a3142", borderRadius: 8, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center" }}>
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, color: "#7C32C9", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>{children}</div>;
}

function Field({ name, label, required, placeholder, type = "text", style, mono, textarea, rows = 1 }: any) {
  return (
    <div style={{ flex: 1, ...style }}>
      <label style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "block" }}>{label}</label>
      {textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows}
          style={{ width: "100%", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder}
          style={{ width: "100%", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: mono ? "monospace" : undefined, boxSizing: "border-box" }} />
      )}
    </div>
  );
}

function SelectField({ name, label, options, defaultValue }: any) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "block" }}>{label}</label>
      <select name={name} defaultValue={defaultValue}
        style={{ width: "100%", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }}>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
