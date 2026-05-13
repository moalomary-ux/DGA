import { db } from '@/lib/db';
import { Handshake, Plus, Building2, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Partner {
  id: number; name_ar: string; name_en: string | null;
  type: string | null; website: string | null; status: string;
}

const TYPE_LABELS: Record<string, { label: string; className: string; icon: typeof Building2 }> = {
  government: { label: 'جهة حكومية', className: 'badge-info',    icon: Building2 },
  vendor:     { label: 'مزوّد',       className: 'badge-purple',  icon: Globe },
  academic:   { label: 'أكاديمي',    className: 'badge-success', icon: Building2 },
};

export default async function PartnersPage() {
  const partners = await db<Partner[]>`
    SELECT * FROM partners WHERE status = 'active' ORDER BY type, name_ar
  `;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>الشركاء</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>الجهات والمزوّدون المتعاونون مع قدراتك</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> شريك جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {partners.map((p) => {
          const t = p.type ? TYPE_LABELS[p.type] : null;
          const Icon = t?.icon || Building2;
          return (
            <div key={p.id} className="card" style={{ padding: 20, transition: 'all 200ms', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--primary-bg-2)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{p.name_ar}</div>
                  {p.name_en && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {p.name_en}
                    </div>
                  )}
                </div>
              </div>
              {t && <span className={`badge ${t.className}`}>{t.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
