import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { detectTenant } from '@/lib/tenant';
import { MessageCircle, Lightbulb, HelpCircle, Megaphone, BookOpen, Pin, Plus } from 'lucide-react';
import { Pill } from '@/components/qtech/Pill';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CAT_META: Record<string, { ar: string; icon: typeof MessageCircle; color: string }> = {
  idea:         { ar: 'فكرة',         icon: Lightbulb,    color: 'var(--warning)' },
  discussion:   { ar: 'نقاش',         icon: MessageCircle, color: 'var(--primary)' },
  question:     { ar: 'سؤال',         icon: HelpCircle,    color: 'var(--accent-2)' },
  announcement: { ar: 'إعلان',        icon: Megaphone,     color: 'var(--danger)' },
  knowledge:    { ar: 'بنك معرفي',    icon: BookOpen,      color: 'var(--success)' },
};

const STATUS_META: Record<string, { ar: string; tone: 'success' | 'warning' | 'info' | 'muted' }> = {
  open:         { ar: 'مفتوح',         tone: 'info'    },
  in_review:    { ar: 'قيد المراجعة',  tone: 'warning' },
  accepted:     { ar: 'معتمد',          tone: 'success' },
  implemented:  { ar: 'منفّذ',           tone: 'success' },
  archived:     { ar: 'مؤرشف',          tone: 'muted'   },
};

export default async function ForumPage() {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');

  if (tenant.id !== 'qtech') {
    return (
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>المنتدى</h1>
        <p style={{ color: 'var(--text-3)' }}>هذه الصفحة متاحة فقط في بوابة قدراتك.</p>
      </div>
    );
  }

  const topics = await db<{
    id: number; title: string; body: string; category: string; status: string;
    author_name: string | null; tags: string[] | null;
    views_count: number; replies_count: number;
    is_pinned: boolean; created_at: Date;
  }[]>`
    SELECT id, title, body, category, status, author_name, tags,
      views_count, replies_count, is_pinned, created_at
    FROM forum_topics
    WHERE tenant = 'qtech'
    ORDER BY is_pinned DESC, created_at DESC
    LIMIT 50
  `.catch(() => []);

  const totalsByCategory = await db<{ category: string; count: string }[]>`
    SELECT category, COUNT(*) as count FROM forum_topics
    WHERE tenant = 'qtech' GROUP BY category
  `.catch(() => []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4, fontWeight: 700 }}>منتدى الأفكار والنقاش</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
            مساحة الفريق للتفكير بصوت عالٍ — أفكار، أسئلة، نقاشات، بنك معرفي
          </p>
        </div>
        <button style={{
          padding: '10px 16px', background: 'var(--grad-2)',
          color: '#fff', border: 0, borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} /> موضوع جديد
        </button>
      </div>

      {/* تصنيفات */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10, marginBottom: 24,
      }}>
        {Object.entries(CAT_META).map(([code, meta]) => {
          const Icon = meta.icon;
          const count = Number(totalsByCategory.find((c) => c.category === code)?.count || 0);
          return (
            <div key={code} style={{
              padding: 14, background: 'var(--surface)',
              border: '1px solid var(--line)', borderRadius: 12,
              borderInlineStart: `3px solid ${meta.color}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon size={14} style={{ color: meta.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{meta.ar}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: meta.color }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* قائمة المواضيع */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>أحدث المواضيع</h3>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{topics.length} موضوع</span>
        </div>
        {topics.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Lightbulb size={48} style={{ color: 'var(--text-4)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 4 }}>لا يوجد مواضيع بعد</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>كن أول من يفتح نقاشاً أو يطرح فكرة</p>
          </div>
        ) : (
          <div>
            {topics.map((t) => {
              const cat = CAT_META[t.category] || CAT_META.discussion;
              const status = STATUS_META[t.status] || STATUS_META.open;
              const Icon = cat.icon;
              return (
                <Link key={t.id} href={`/forum/${t.id}`}
                  style={{
                    display: 'block', padding: '14px 18px',
                    borderBottom: '1px solid var(--line-soft)',
                    textDecoration: 'none', color: 'inherit',
                  }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${cat.color}22`, color: cat.color,
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        {t.is_pinned && <Pin size={12} style={{ color: 'var(--warning)' }} />}
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.title}</h4>
                        <Pill tone={status.tone}>{status.ar}</Pill>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.6 }}>
                        {t.body.length > 150 ? t.body.slice(0, 150) + '...' : t.body}
                      </p>
                      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
                        <span>👤 {t.author_name || 'مستخدم'}</span>
                        <span>💬 {t.replies_count} رد</span>
                        <span>👁️ {t.views_count}</span>
                        <span>{new Date(t.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
