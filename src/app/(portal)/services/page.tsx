import { db } from '@/lib/db';
import {
  FileText, MessageSquare, Award, Cog, Shield,
  type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ServiceCategory {
  id: number; code: string; name_ar: string;
  category_group: string; description: string | null;
}

const GROUPS: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  studies:    { label: 'الدراسات',                     icon: FileText,      color: '#7c32c9', bg: 'rgba(124,50,201,0.10)' },
  consulting: { label: 'الاستشارات',                  icon: MessageSquare, color: '#00abaf', bg: 'rgba(0,171,175,0.10)' },
  expert:     { label: 'الخبراء المعرفيون',         icon: Award,         color: '#1cc182', bg: 'rgba(28,193,130,0.10)' },
  systems:    { label: 'تطوير الأنظمة',               icon: Cog,           color: '#ff7b50', bg: 'rgba(255,123,80,0.10)' },
  policy:     { label: 'السياسات والأطر',            icon: Shield,        color: '#2a206a', bg: 'rgba(42,32,106,0.10)' },
};

export default async function ServicesPage() {
  const services = await db<ServiceCategory[]>`
    SELECT id, code, name_ar, category_group, description
    FROM service_categories
    WHERE is_active = true
    ORDER BY category_group, display_order, name_ar
  `;

  // group by category_group
  const grouped = services.reduce<Record<string, ServiceCategory[]>>((acc, s) => {
    if (!acc[s.category_group]) acc[s.category_group] = [];
    acc[s.category_group].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>خدماتنا الاستشارية</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          {services.length} نوع خدمة استشارية متخصصة موزّعة على {Object.keys(grouped).length} مجموعات
        </p>
      </div>

      {Object.entries(grouped).map(([groupKey, items]) => {
        const g = GROUPS[groupKey] || { label: groupKey, icon: FileText, color: 'var(--text)', bg: 'var(--surface-2)' };
        const GroupIcon = g.icon;
        return (
          <div key={groupKey} style={{ marginBottom: 36 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
              paddingBottom: 12, borderBottom: '1px solid var(--line-soft)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: g.bg, color: g.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GroupIcon size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 2 }}>{g.label}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{items.length} خدمة</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {items.map((s) => (
                <div key={s.id} className="card" style={{ padding: 18 }}>
                  <div style={{
                    display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                    background: g.bg, color: g.color,
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                    marginBottom: 10,
                  }}>{s.code}</div>
                  <h3 style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>{s.name_ar}</h3>
                  {s.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
