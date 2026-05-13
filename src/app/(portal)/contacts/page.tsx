'use client';
import { useEffect, useMemo, useState } from 'react';

type Tab = 'network' | 'gov_entities' | 'excluded_entities';

interface NetworkContact {
  mac_kg_id: number;
  full_name_ar: string | null;
  full_name_en: string | null;
  primary_email: string | null;
  organization_ar: string | null;
  organization_short: string | null;
  department_ar: string | null;
  job_title_ar: string | null;
  sector_label: string | null;
  relationship_to_mohammed: string | null;
  seniority_level: number | null;
  importance: number | null;
  last_synced_at: string | null;
}

const REL_LABEL: Record<string, string> = {
  self: 'أنا',
  direct_report: 'تقرير مباشر',
  leadership: 'قيادة',
  peer: 'زميل',
  partner: 'شريك',
  external: 'خارجي',
  vendor: 'مورّد',
};

const REL_COLOR: Record<string, string> = {
  self: '#a76eff',
  direct_report: '#10b981',
  leadership: '#f59e0b',
  peer: '#3b82f6',
  partner: '#06b6d4',
  external: '#94a3b8',
  vendor: '#fb7185',
};

function relTime(v: any) {
  if (!v) return '—';
  try {
    const d = new Date(v);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return d.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function StatCard({ icon, label, value, gradient }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-5"
         style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
      <div className="absolute inset-0 opacity-30" style={{ background: gradient }} />
      <div className="relative">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-xs opacity-70 mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value?.toLocaleString('en-US') ?? '—'}</div>
      </div>
    </div>
  );
}

function ImportanceStars({ value }: { value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < value ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </div>
  );
}

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>('network');
  const [q, setQ] = useState('');
  const [qDeb, setQDeb] = useState('');
  const [relFilter, setRelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => { setQDeb(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // reset on tab change
  useEffect(() => {
    setQ(''); setQDeb(''); setRelFilter(''); setPage(1);
  }, [tab]);

  // fetch
  useEffect(() => {
    setLoading(true);
    let url = '';
    if (tab === 'network') {
      const p = new URLSearchParams({ page: String(page), limit: '50' });
      if (qDeb) p.set('q', qDeb);
      if (relFilter) p.set('relationship', relFilter);
      url = `/api/contacts/network?${p}`;
    } else {
      const p = new URLSearchParams({ dataset: tab, page: String(page), limit: '50' });
      if (qDeb) p.set('q', qDeb);
      url = `/api/operations/data?${p}`;
    }
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [tab, qDeb, relFilter, page]);

  const counts = useMemo(() => {
    if (tab !== 'network') return { network: '—' as any, gov: data?.total ?? '—', excl: '—' };
    return { network: data?.total ?? '—', gov: '380', excl: '18' };
  }, [tab, data]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          📇 جهات الاتصال
        </h1>
        <p className="text-sm opacity-70" style={{ color: 'var(--text-muted)' }}>
          الشبكة الشخصية + الجهات الحكومية + الجهات المستبعدة
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'network', label: '🌐 شبكتي', source: 'PKG' },
          { id: 'gov_entities', label: '🏛️ الجهات الحكومية', source: '380' },
          { id: 'excluded_entities', label: '🚫 جهات مستبعدة', source: '18' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? '' : 'opacity-60 hover:opacity-100'}`}
            style={{
              borderColor: tab === t.id ? 'var(--accent, #7C32C9)' : 'transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
            }}>
            {t.label}
            <span className="text-xs opacity-50 mr-1.5">({t.source})</span>
          </button>
        ))}
      </div>

      {/* ─── NETWORK TAB ─── */}
      {tab === 'network' && (
        <>
          {data?.facets?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => { setRelFilter(''); setPage(1); }}
                className="text-xs px-3 py-1.5 rounded-lg border"
                style={{
                  background: !relFilter ? 'linear-gradient(135deg, #7C32C9, #00ABAF)' : 'transparent',
                  borderColor: 'var(--border)',
                  color: !relFilter ? '#fff' : 'var(--text)',
                }}>
                الكل ({data.total})
              </button>
              {data.facets.map((f: any) => {
                const c = REL_COLOR[f.relationship] || '#94a3b8';
                const active = relFilter === f.relationship;
                return (
                  <button key={f.relationship} onClick={() => { setRelFilter(active ? '' : f.relationship); setPage(1); }}
                    className="text-xs px-3 py-1.5 rounded-lg border"
                    style={{
                      background: active ? c : `${c}20`,
                      borderColor: active ? c : `${c}40`,
                      color: active ? '#fff' : c,
                    }}>
                    {REL_LABEL[f.relationship] || f.relationship} ({f.cnt})
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border p-3 mb-4 flex gap-2 items-center"
               style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="🔍 ابحث بالاسم، الإيميل، الجهة، أو المسمى..."
              className="flex-1 bg-transparent text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))', color: 'var(--text)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.rows || []).map((c: NetworkContact) => {
              const rel = c.relationship_to_mohammed || 'external';
              const relColor = REL_COLOR[rel] || '#94a3b8';
              return (
                <div key={c.mac_kg_id} className="rounded-2xl border p-4 hover:shadow-lg transition-shadow"
                     style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-1 line-clamp-1" style={{ color: 'var(--text)' }}>
                        {c.full_name_ar || c.full_name_en || '—'}
                      </h3>
                      {c.full_name_en && c.full_name_ar && (
                        <p className="text-xs opacity-60 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{c.full_name_en}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md whitespace-nowrap" style={{
                      background: `${relColor}20`, color: relColor, border: `1px solid ${relColor}40`,
                    }}>{REL_LABEL[rel] || rel}</span>
                  </div>

                  {c.job_title_ar && (
                    <p className="text-sm mb-1.5 line-clamp-2" style={{ color: 'var(--text)' }}>{c.job_title_ar}</p>
                  )}
                  {c.department_ar && (
                    <p className="text-xs opacity-70 mb-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{c.department_ar}</p>
                  )}
                  {c.organization_ar && (
                    <p className="text-xs opacity-60 mb-3 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {c.organization_short ? `${c.organization_short} · ` : ''}{c.organization_ar}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border, rgba(255,255,255,0.05))' }}>
                    <div className="text-xs opacity-70 truncate" style={{ color: 'var(--text-muted)' }}>
                      {c.primary_email && (
                        <a href={`mailto:${c.primary_email}`} className="hover:underline" style={{ color: 'var(--accent, #a76eff)' }}>
                          ✉️ {c.primary_email}
                        </a>
                      )}
                    </div>
                    <ImportanceStars value={c.importance} />
                  </div>
                </div>
              );
            })}
            {!loading && data?.rows?.length === 0 && (
              <div className="col-span-full text-center py-12 opacity-60" style={{ color: 'var(--text-muted)' }}>لا توجد نتائج</div>
            )}
          </div>
        </>
      )}

      {/* ─── GOV / EXCLUDED TABS ─── */}
      {(tab === 'gov_entities' || tab === 'excluded_entities') && (
        <>
          <div className="rounded-xl border p-3 mb-4 flex gap-2 items-center"
               style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="🔍 ابحث..."
              className="flex-1 bg-transparent text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))', color: 'var(--text)' }} />
            <div className="text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>
              {data?.total || 0} نتيجة
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden"
               style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
            {loading && <div className="h-1 bg-gradient-to-l from-purple-500 to-teal-500 animate-pulse" />}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <tr>
                    {data?.data?.[0] && Object.keys(data.data[0]).slice(0, 6).map(k => (
                      <th key={k} className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).map((row: any, i: number) => (
                    <tr key={i} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border, rgba(255,255,255,0.05))' }}>
                      {Object.keys(row).slice(0, 6).map(k => (
                        <td key={k} className="px-4 py-3 text-xs max-w-[280px] truncate" style={{ color: 'var(--text)' }} title={String(row[k] ?? '')}>
                          {row[k] ?? <span className="opacity-30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pages > 1 && (
              <div className="flex items-center justify-between p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-30"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>← السابق</button>
                <div className="text-sm tabular-nums opacity-70" style={{ color: 'var(--text-muted)' }}>
                  صفحة {page} من {data.pages}
                </div>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages}
                  className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-30"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>التالي →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
