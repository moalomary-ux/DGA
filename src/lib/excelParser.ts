import * as XLSX from "xlsx";

export interface ParsedRow {
  name?: string; email?: string; phone?: string;
  jobTitle?: string; organization?: string; nationalId?: string;
  raw: Record<string, any>;
}

const COL_MAP: Record<string, keyof ParsedRow> = {
  "الاسم": "name", "الاسم الرباعي": "name", "الاسم الكامل": "name", "اسم": "name",
  "الإيميل": "email", "البريد الالكتروني": "email", "البريد": "email", "ايميل": "email", "email": "email",
  "الجوال": "phone", "رقم الجوال": "phone", "الهاتف": "phone", "phone": "phone", "mobile": "phone",
  "المسمى الوظيفي": "jobTitle", "المسمى": "jobTitle", "الوظيفة": "jobTitle", "job title": "jobTitle", "title": "jobTitle",
  "الجهة": "organization", "جهة العمل": "organization", "المؤسسة": "organization", "organization": "organization", "org": "organization",
  "الهوية الوطنية": "nationalId", "رقم الهوية": "nationalId", "national id": "nationalId",
};

const norm = (s: string) => String(s).trim().toLowerCase().replace(/\s+/g, " ");

export function normalizePhone(p: string | undefined | null): string {
  if (!p) return "";
  let d = String(p).replace(/[^0-9]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("966")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

// merge single-letter Arabic tokens with next: "أ حمد" → "أحمد"
function mergeBrokenArabic(text: string): string {
  const tokens = text.split(/\s+/);
  const out: string[] = [];
  let buf = "";
  for (const t of tokens) {
    if (t.length === 1 && /[\u0600-\u06FF]/.test(t)) {
      buf += t;
    } else {
      if (buf) { out.push(buf + t); buf = ""; }
      else out.push(t);
    }
  }
  if (buf) out.push(buf);
  return out.join(" ");
}

export function normalizeArabicName(name: string | undefined | null): string {
  if (!name) return "";
  let n = String(name)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  n = mergeBrokenArabic(n);
  return n.replace(/\s+/g, " ").trim().toLowerCase();
}

// Strip common org prefixes for fuzzy matching
export function normalizeOrgName(org: string | undefined | null): string {
  if (!org) return "";
  let n = String(org)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/^(هيئة|الهيئة|وزارة|الوزارة|ادارة|الإدارة|مؤسسة|المؤسسة|شركة|الشركة|مكتب|المكتب)\s+/i, "")
    .replace(/\s+/g, " ").trim().toLowerCase();
  return n;
}

export function parseExcelBuffer(buf: Buffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows.map((row): ParsedRow => {
    const r: ParsedRow = { raw: row };
    for (const [k, v] of Object.entries(row)) {
      const f = COL_MAP[norm(k)] || COL_MAP[k.trim()];
      if (f && v) (r as any)[f] = String(v).trim();
    }
    return r;
  }).filter(r => r.email || r.nationalId || r.name);
}
