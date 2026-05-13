import { db } from '@/lib/db';
import { Building2, Plus, Mail, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Client {
  id: number; name_ar: string; name_en: string | null; type: string | null;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  studies_count: string;
}

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  ministry:     { label: 'وزارة',   className: 'badge-info'    },
  authority:    { label: 'هيئة',    className: 'badge-purple'  },
  municipality: { label: 'بلدية',   className: 'badge-success' },
};

export default async function ClientsPage() {
  const clients = await db<Client[]>`
    SELECT c.*,
      COALESCE((SELECT COUNT(*) FROM studies s WHERE s.client_id = c.id), 0) as studies_count
    FROM clients c
    ORDER BY c.name_ar
  `;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>العملاء</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>الجهات الحكومية المستفيدة من الدراسات والاستشارات</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> عميل جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {clients.map((c) => {
          const t = c.type ? TYPE_LABELS[c.type] : null;
          return (
            <div key={c.id} className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: 'var(--primary-bg-2)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={22} strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{c.name_ar}</div>
                  {c.name_en && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.name_en}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {t && <span className={`badge ${t.className}`}>{t.label}</span>}
                <span className="badge badge-neutral">{c.studies_count} دراسة</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
