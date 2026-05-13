'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Building2, Award, Users, UserCog, Search,
  Download, ExternalLink, X, Loader2,
  TrendingUp, Calendar, MapPin, Mail, Phone, 
  GraduationCap, Target, Sparkles, Database, Activity,
  Trophy, Clock, Hourglass, CheckCircle2, AlertTriangle, Globe
} from 'lucide-react';

const SECTOR_COLORS: Record<string, string> = {
  'الصحي': 'bg-red-500/15 text-red-300 border-red-500/30',
  'العدل': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'المالي': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'الاتصالات': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'النقل': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'الجامعات': 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  'الإبداع': 'bg-pink-500/15 text-pink-300',
  'التكامل': 'bg-indigo-500/15 text-indigo-300',
  'التحسين': 'bg-teal-500/15 text-teal-300',
  'الإتاحة': 'bg-sky-500/15 text-sky-300',
  'البناء': 'bg-orange-500/15 text-orange-300',
};

const TIMELINE_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: 'منتهي', color: 'bg-zinc-700/40 text-zinc-300 border-zinc-700', icon: CheckCircle2 },
  ongoing: { label: 'جارٍ الآن', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Activity },
  upcoming: { label: 'قادم', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
};

const ENGAGEMENT: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'جهة متفاعلة', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  moderate: { label: 'تفاعل متوسط', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Activity },
  inactive: { label: 'جهة خاملة', color: 'bg-zinc-700/40 text-zinc-400 border-zinc-700', icon: AlertTriangle },
  unknown: { label: 'بدون تفاعل', color: 'bg-zinc-700/40 text-zinc-500 border-zinc-700', icon: Hourglass },
};

type Tab = 'overview' | 'orgs' | 'programs' | 'beneficiaries' | 'liaisons';

function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtNum(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('ar-SA');
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
export function DataCenterView() {
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    const orgId = url.searchParams.get('org');
    const programId = url.searchParams.get('program');
    if (orgId) { setTab('orgs'); setSelectedOrgId(parseInt(orgId, 10)); }
    if (programId) { setTab('programs'); setSelectedProgramId(parseInt(programId, 10)); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/qtech/data-center/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'orgs', label: 'الجهات', icon: Building2, count: stats?.stats?.orgs_active },
    { id: 'programs', label: 'البرامج', icon: Award, count: stats?.stats?.programs_total },
    { id: 'beneficiaries', label: 'المستفيدون', icon: Users, count: stats?.stats?.beneficiaries_total },
    { id: 'liaisons', label: 'ضباط الاتصال', icon: UserCog, count: stats?.stats?.liaisons_total },
  ];

  return (
    <div className="px-5 py-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1 flex items-center gap-2">
            <Database size={20} className="text-teal-400" />
            مركز البيانات
          </h1>
          <p className="text-xs text-zinc-500">القاعدة الموحّدة لكل بيانات قدراتك</p>
        </div>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
          <Download size={12} /> تصدير
        </button>
      </div>

      <div className="flex gap-1 border-b border-zinc-800 mb-5 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedOrgId(null); setSelectedProgramId(null); }}
              className={`px-4 py-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                active ? 'border-teal-500 text-teal-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} /><span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  active ? 'bg-teal-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                }`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading && tab === 'overview' ? (
        <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={28} /></div>
      ) : (
        <>
          {tab === 'overview' && stats && <OverviewTab stats={stats} onJumpToOrg={(id) => { setTab('orgs'); setSelectedOrgId(id); }} onJumpToProgram={(id) => { setTab('programs'); setSelectedProgramId(id); }} />}
          {tab === 'orgs' && <OrgsTab selectedOrgId={selectedOrgId} onSelectOrg={setSelectedOrgId} onOpenProgram={setSelectedProgramId} />}
          {tab === 'programs' && <ProgramsTab selectedProgramId={selectedProgramId} onSelectProgram={setSelectedProgramId} onOpenOrg={setSelectedOrgId} />}
          {tab === 'beneficiaries' && <BeneficiariesTab onOpenProgram={setSelectedProgramId} onOpenOrg={setSelectedOrgId} />}
          {tab === 'liaisons' && <LiaisonsTab onOpenOrg={setSelectedOrgId} />}
        </>
      )}

      {/* Program drawer is global so it works from any tab */}
      {selectedProgramId && (
        <ProgramDetailDrawer
          programId={selectedProgramId}
          onClose={() => setSelectedProgramId(null)}
          onOpenOrg={(id) => { setSelectedProgramId(null); setSelectedOrgId(id); setTab('orgs'); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════════
function OverviewTab({ stats, onJumpToOrg, onJumpToProgram }: any) {
  const s = stats.stats;
  const totalCost = s.total_cost_sar ? (Number(s.total_cost_sar) / 1000000).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="جهات نشطة" value={s.orgs_active} total={s.orgs_total} color="indigo" icon={Building2} />
        <StatCard label="البرامج المنفذة" value={s.programs_total} sub={`${s.programs_online} أونلاين`} color="purple" icon={Award} />
        <StatCard label="المستفيدون" value={s.beneficiaries_total} sub={`${s.beneficiaries_unique_emails} فريد`} color="teal" icon={Users} />
        <StatCard label="ضباط الاتصال" value={s.liaisons_total} sub={`${s.liaisons_linked} مرتبط`} color="cyan" icon={UserCog} />
        <StatCard label="المقاعد" value={s.total_seats} color="amber" icon={Target} />
        <StatCard label="الاستثمار" value={`${totalCost}M`} sub="ريال" color="emerald" icon={TrendingUp} confidential />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-teal-400" />أعلى القطاعات استفادة</h3>
          <div className="space-y-2">
            {stats.sectors.map((sec: any) => {
              const max = Math.max(...stats.sectors.map((x: any) => x.beneficiaries));
              const pct = (sec.beneficiaries / max) * 100;
              return (
                <div key={sec.sector}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="text-zinc-200 truncate flex-1">{sec.sector}</div>
                    <div className="text-zinc-500 font-mono text-[10px]">{sec.orgs} جهة · {sec.beneficiaries} مستفيد</div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-teal-400" />النمو السنوي</h3>
          {stats.beneficiariesByYear.length > 0 && (() => {
            const max = Math.max(...stats.beneficiariesByYear.map((y: any) => y.count || 0));
            return (
              <div className="flex items-end justify-between gap-1.5 h-40 pt-3">
                {stats.beneficiariesByYear.map((y: any) => {
                  const pct = max ? (y.count / max) * 100 : 0;
                  return (
                    <div key={y.year} className="flex-1 flex flex-col items-center">
                      <div className="text-[10px] text-zinc-300 mb-1 font-mono">{y.count}</div>
                      <div className="w-full bg-zinc-800 rounded-t-md overflow-hidden flex flex-col justify-end" style={{ height: `${pct}%`, minHeight: '8px' }}>
                        <div className="bg-gradient-to-t from-teal-500 to-emerald-400 w-full" style={{ height: '100%' }} />
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono">{y.year}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><Trophy size={14} className="text-teal-400" />أكثر 10 جهات استفادة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-zinc-500 text-[10px] border-b border-zinc-800">
              <tr>
                <th className="text-right py-2 px-2">#</th>
                <th className="text-right py-2 px-2">الجهة</th>
                <th className="text-right py-2 px-2">القطاع</th>
                <th className="text-right py-2 px-2">التصنيف</th>
                <th className="text-right py-2 px-2">المقاعد</th>
                <th className="text-right py-2 px-2">المستفيدون</th>
                <th className="text-right py-2 px-2">الاستخدام</th>
              </tr>
            </thead>
            <tbody>
              {stats.topOrgs.map((o: any, i: number) => (
                <tr key={o.id} onClick={() => onJumpToOrg(o.id)} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer">
                  <td className="py-2.5 px-2 text-zinc-500 font-mono">{i + 1}</td>
                  <td className="py-2.5 px-2 text-zinc-200 font-bold">{o.name_ar}</td>
                  <td className="py-2.5 px-2 text-zinc-400">{o.sector}</td>
                  <td className="py-2.5 px-2">
                    {o.classification && CLASSIFICATION_COLORS[o.classification] && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[o.classification]}`}>{o.classification}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-zinc-400 font-mono">{o.quota || '-'}</td>
                  <td className="py-2.5 px-2 text-teal-300 font-bold font-mono">{o.beneficiaries}</td>
                  <td className="py-2.5 px-2 w-32">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-9 text-right text-zinc-500">{o.utilization_pct || '0'}%</span>
                      <div className="flex-1 h-1 bg-zinc-800 rounded"><div className="h-full bg-teal-500 rounded" style={{ width: `${Math.min(100, o.utilization_pct || 0)}%` }} /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════
function StatCard({ label, value, total, sub, color, icon: Icon, confidential }: any) {
  const colorClasses: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  };
  const textColors: Record<string, string> = {
    indigo: 'text-indigo-300', purple: 'text-purple-300', teal: 'text-teal-300',
    cyan: 'text-cyan-300', amber: 'text-amber-300', emerald: 'text-emerald-300',
  };
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-3 relative`}>
      {confidential && <div className="absolute top-2 left-2 text-[8px] text-zinc-500">🔒</div>}
      <Icon size={16} className={`${textColors[color]} mb-1.5`} />
      <div className="text-[10px] text-zinc-400 mb-0.5">{label}</div>
      <div className={`text-xl font-bold ${textColors[color]}`}>
        {typeof value === 'number' ? fmtNum(value) : value}
        {total && <span className="text-zinc-500 text-xs mr-1">/ {fmtNum(total)}</span>}
      </div>
      {sub && <div className="text-[9px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ORGS TAB + Drawer v2
// ════════════════════════════════════════════════════════════════
function OrgsTab({ selectedOrgId, onSelectOrg, onOpenProgram }: any) {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [classification, setClassification] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (sector) params.set('sector', sector);
    if (classification) params.set('classification', classification);
    fetch(`/api/qtech/data-center/orgs?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [search, sector, classification]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في الجهات..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50" />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل القطاعات</option>
          {data?.filters?.sectors?.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={classification} onChange={(e) => setClassification(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل التصنيفات</option>
          {data?.filters?.classifications?.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-[11px] text-zinc-500">{data?.orgs?.length || 0} نتيجة</span>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={24} /></div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-950/60 text-zinc-500 text-[10px] uppercase">
                <tr>
                  <th className="text-right py-2.5 px-3">الجهة</th>
                  <th className="text-right py-2.5 px-3">القطاع</th>
                  <th className="text-right py-2.5 px-3">التصنيف</th>
                  <th className="text-right py-2.5 px-3">الحصة</th>
                  <th className="text-right py-2.5 px-3">المستفيدون</th>
                  <th className="text-right py-2.5 px-3">البرامج</th>
                  <th className="text-right py-2.5 px-3">الضباط</th>
                  <th className="text-right py-2.5 px-3">الاستخدام</th>
                </tr>
              </thead>
              <tbody>
                {data?.orgs?.map((o: any) => (
                  <tr key={o.id} onClick={() => onSelectOrg(o.id)} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition">
                    <td className="py-2.5 px-3 text-zinc-200 font-bold">{o.name_ar}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{o.sector || '-'}</td>
                    <td className="py-2.5 px-3">
                      {o.classification && CLASSIFICATION_COLORS[o.classification] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[o.classification]}`}>{o.classification}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{o.quota || '-'}</td>
                    <td className="py-2.5 px-3 text-teal-300 font-bold font-mono">{o.beneficiaries}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{o.programs}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{o.liaisons_count}</td>
                    <td className="py-2.5 px-3 w-32">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-9 text-right text-zinc-500">{o.utilization_pct || '0'}%</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded"><div className="h-full bg-teal-500 rounded" style={{ width: `${Math.min(100, o.utilization_pct || 0)}%` }} /></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrgId && <OrgDetailDrawer orgId={selectedOrgId} onClose={() => onSelectOrg(null)} onOpenProgram={onOpenProgram} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ORG DETAIL DRAWER v2 — Engagement + Top Performers + Last Program
// ════════════════════════════════════════════════════════════════
function OrgDetailDrawer({ orgId, onClose, onOpenProgram }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'overview' | 'programs' | 'beneficiaries' | 'top' | 'liaisons' | 'emails'>('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/qtech/data-center/orgs/${orgId}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [orgId]);

  if (loading || !data?.org) {
    return (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur flex items-center justify-center" onClick={onClose}>
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  const { org, liaisons = [], programs = [], lastProgram, beneficiaries = [], beneficiariesByYear = [], targetLevelBreakdown = [], topPerformers = [], recentEmails = [] } = data;
  const sectorClass = SECTOR_COLORS[org.sector || ''] || 'bg-zinc-700/40 text-zinc-300';
  const classBadge = CLASSIFICATION_COLORS[org.classification || ''];
  const engagement = ENGAGEMENT[org.engagement_status || 'unknown'];
  const EngIcon = engagement.icon;

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur flex" onClick={onClose} dir="rtl">
      <div className="ml-auto h-full w-[min(95vw,1000px)] bg-zinc-950 border-r border-zinc-800 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-bl from-teal-500/10 to-zinc-900 border-b border-zinc-800 p-5">
          <button onClick={onClose} className="float-left text-zinc-500 hover:text-zinc-200 p-1"><X size={18} /></button>
          <div className="flex items-center gap-1.5 text-teal-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
            <Building2 size={11} /> ملف الجهة الحكومية
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">{org.name_ar}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {org.sector && <span className={`text-xs px-2 py-0.5 rounded-md border ${sectorClass}`}>{org.sector}</span>}
            {classBadge && <span className={`text-xs px-2 py-0.5 rounded-md ${classBadge}`}>{org.classification}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${engagement.color}`}>
              <EngIcon size={10} />{engagement.label}
            </span>
            {org.email_domain && <code className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{org.email_domain}</code>}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-zinc-800 px-5 flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة', icon: BarChart3 },
            { id: 'programs', label: 'البرامج', icon: Award, count: programs.length },
            { id: 'beneficiaries', label: 'المستفيدون', icon: Users, count: beneficiaries.length },
            { id: 'top', label: 'المتميزون', icon: Trophy, count: topPerformers.length },
            { id: 'liaisons', label: 'الضباط', icon: UserCog, count: liaisons.length },
            { id: 'emails', label: 'الإيميلات', icon: Mail, count: recentEmails.length },
          ].map((t: any) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)} className={`px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                active ? 'border-teal-500 text-teal-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}>
                <Icon size={12} />{t.label}
                {t.count !== undefined && <span className="text-[9px] bg-zinc-800 px-1 rounded">{t.count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* ── OVERVIEW ── */}
          {subTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="المستفيدون" value={org.total_beneficiaries_count || 0} color="teal" icon={Users} />
                <StatCard label="البرامج" value={org.total_programs_count || 0} color="purple" icon={Award} />
                <StatCard label="الحصة" value={org.total_quota_seats || 0} color="amber" icon={Target} />
                <StatCard label="الاستخدام" value={`${org.utilization_pct || 0}%`} color="emerald" icon={TrendingUp} />
              </div>

              {/* Engagement Card */}
              <div className={`border rounded-xl p-4 ${engagement.color.replace('text-', 'border-').replace('/30', '/20')} bg-zinc-900/40`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-500 mb-1">حالة التفاعل</div>
                    <div className="flex items-center gap-2">
                      <EngIcon size={18} className={engagement.color.split(' ')[1]} />
                      <span className={`text-base font-bold ${engagement.color.split(' ')[1]}`}>{engagement.label}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-500">آخر إيميل</div>
                    <div className="text-xs text-zinc-300">{fmtDate(org.last_email_date)}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">آخر برنامج</div>
                    <div className="text-xs text-zinc-300">{fmtDate(org.last_program_date)}</div>
                  </div>
                </div>
              </div>

              {/* Last Program Card */}
              {lastProgram && (
                <div className="bg-gradient-to-bl from-teal-500/10 to-zinc-900/40 border border-teal-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-teal-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    <Award size={11} /> آخر برنامج استفادوا منه
                  </div>
                  <button onClick={() => onOpenProgram(lastProgram.id)} className="w-full text-right hover:bg-zinc-800/30 rounded-lg p-2 -m-2 transition">
                    <div className="text-base font-bold text-zinc-100 mb-1">{lastProgram.title}</div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                      <span>{lastProgram.type || '-'}</span>
                      <span>·</span>
                      <span>{lastProgram.year}</span>
                      {lastProgram.country && <><span>·</span><span><MapPin size={10} className="inline" /> {lastProgram.country}</span></>}
                      <span>·</span>
                      <span className="text-teal-400 font-bold">{lastProgram.attended_count} حضر</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      <Calendar size={9} className="inline ml-1" /> {fmtDate(lastProgram.start_date)} → {fmtDate(lastProgram.end_date)}
                    </div>
                  </button>
                </div>
              )}

              {beneficiariesByYear.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-teal-400" />استفادة الجهة عبر السنوات</h3>
                  {(() => {
                    const max = Math.max(...beneficiariesByYear.map((y: any) => y.count));
                    return (
                      <div className="flex items-end justify-between gap-1.5 h-32 pt-3">
                        {beneficiariesByYear.map((y: any) => {
                          const pct = max ? (y.count / max) * 100 : 0;
                          return (
                            <div key={y.year} className="flex-1 flex flex-col items-center">
                              <div className="text-[10px] text-zinc-300 mb-1 font-mono">{y.count}</div>
                              <div className="w-full bg-zinc-800 rounded-t flex flex-col justify-end" style={{ height: `${pct}%`, minHeight: '6px' }}>
                                <div className="bg-gradient-to-t from-teal-500 to-emerald-400 w-full" style={{ height: '100%' }} />
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1 font-mono">{y.year}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {targetLevelBreakdown.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><GraduationCap size={14} className="text-teal-400" /> توزيع المستفيدين حسب المستوى</h3>
                  <div className="space-y-2">
                    {targetLevelBreakdown.map((tl: any) => {
                      const max = Math.max(...targetLevelBreakdown.map((x: any) => x.count));
                      const pct = (tl.count / max) * 100;
                      return (
                        <div key={tl.target_level}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-300">{tl.target_level}</span>
                            <span className="text-zinc-500 font-mono">{tl.count}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROGRAMS ── */}
          {subTab === 'programs' && (
            <div className="space-y-2">
              {programs.length === 0 ? <div className="text-center py-8 text-zinc-500 text-sm">لا توجد برامج</div> :
                programs.map((p: any) => {
                  const ts = TIMELINE_STATUS[p.status_timeline];
                  const TsIcon = ts?.icon || Hourglass;
                  return (
                    <button key={p.id} onClick={() => onOpenProgram(p.id)} className="w-full text-right bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 rounded-lg p-3 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-zinc-100 mb-1">{p.title}</div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                            {ts && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${ts.color}`}>
                                <TsIcon size={9} />{ts.label}
                              </span>
                            )}
                            <span>{p.type || '-'}</span>
                            <span>·</span>
                            <span>{p.year}</span>
                            {p.country && <><span>·</span><span>{p.country}</span></>}
                            {p.start_date && <><span>·</span><span className="text-zinc-400">{fmtDate(p.start_date)}</span></>}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-base font-bold text-teal-300">{p.attended_count}</div>
                          <div className="text-[10px] text-zinc-500">حضر</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* ── BENEFICIARIES ── */}
          {subTab === 'beneficiaries' && <BeneficiariesTable beneficiaries={beneficiaries} onOpenProgram={onOpenProgram} />}

          {/* ── TOP PERFORMERS ── جديد ── */}
          {subTab === 'top' && (
            <div>
              <div className="bg-gradient-to-bl from-amber-500/10 to-zinc-900/40 border border-amber-500/20 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                  <Trophy size={11} /> المتميزون من الجهة
                </div>
                <p className="text-[11px] text-zinc-400">المستفيدون الذين حضروا برنامجَين أو أكثر من برامج قدراتك.</p>
              </div>
              {topPerformers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">لا يوجد مستفيدون متميزون بعد</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topPerformers.map((p: any, i: number) => (
                    <div key={p.email} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                        i === 1 ? 'bg-gradient-to-br from-zinc-400 to-zinc-600' :
                        i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-700' :
                        'bg-gradient-to-br from-teal-500 to-emerald-600'
                      }`}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-zinc-100 mb-0.5">{p.name}</div>
                        {p.job_title && <div className="text-[10px] text-zinc-500 mb-1.5 line-clamp-1">{p.job_title}</div>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 bg-teal-500/15 text-teal-300 rounded font-mono">{p.programs_count} برنامج</span>
                          {p.levels && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-300 rounded">{p.levels}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LIAISONS ── */}
          {subTab === 'liaisons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liaisons.length === 0 ? <div className="col-span-2 text-center py-8 text-zinc-500 text-sm">لا يوجد ضباط اتصال</div> :
                liaisons.map((l: any) => (
                  <div key={l.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
                    <div className="text-sm font-bold text-zinc-100 mb-1">{l.name}</div>
                    {l.title && <div className="text-[11px] text-zinc-400 mb-2">{l.title}</div>}
                    <div className="space-y-1 text-[11px] text-zinc-500">
                      {l.email && <div className="flex items-center gap-1.5"><Mail size={10} /><span className="truncate" dir="ltr">{l.email}</span></div>}
                      {l.phone && l.phone !== 'لايوجد' && <div className="flex items-center gap-1.5"><Phone size={10} />{l.phone}</div>}
                    </div>
                    {l.inbox_count > 0 && <div className="mt-2 text-[10px] text-teal-400">{l.inbox_count} إيميل سابق</div>}
                  </div>
                ))}
            </div>
          )}

          {/* ── EMAILS ── */}
          {subTab === 'emails' && (
            <div className="space-y-2">
              {recentEmails.length === 0 ? <div className="text-center py-8 text-zinc-500 text-sm">لا توجد إيميلات</div> :
                recentEmails.map((e: any) => (
                  <div key={e.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="text-sm text-zinc-200 truncate flex-1">{e.subject || '(بدون موضوع)'}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(e.received_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                    {e.liaison_name && <div className="text-[11px] text-zinc-500">من: {e.liaison_name}</div>}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ★★ PROGRAM DETAIL DRAWER — جديد ★★
// ════════════════════════════════════════════════════════════════
function ProgramDetailDrawer({ programId, onClose, onOpenOrg }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'overview' | 'orgs' | 'beneficiaries'>('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/qtech/data-center/programs/${programId}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [programId]);

  if (loading || !data?.program) {
    return (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur flex items-center justify-center" onClick={onClose}>
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  const { program: p, orgs = [], beneficiaries = [], targetLevels = [], sectorBreakdown = [] } = data;
  const ts = TIMELINE_STATUS[p.status_timeline] || TIMELINE_STATUS.completed;
  const TsIcon = ts.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex" onClick={onClose} dir="rtl">
      <div className="ml-auto h-full w-[min(95vw,1000px)] bg-zinc-950 border-r border-zinc-800 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-bl from-purple-500/10 to-zinc-900 border-b border-zinc-800 p-5">
          <button onClick={onClose} className="float-left text-zinc-500 hover:text-zinc-200 p-1"><X size={18} /></button>
          <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
            <Award size={11} /> ملف البرنامج التدريبي
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3">{p.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${ts.color}`}>
              <TsIcon size={11} />{ts.label}
            </span>
            {p.type && <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300">{p.type}</span>}
            {p.year && <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-700/40 text-zinc-300">{p.year}</span>}
            {p.country && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-700/40 text-zinc-300 flex items-center gap-1">
                <Globe size={10} />{p.country}
              </span>
            )}
            {p.is_high_impact && <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300">⭐ HIGH IMPACT</span>}
          </div>
        </div>

        {/* Quick info bar */}
        <div className="bg-zinc-900/30 border-b border-zinc-800 px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={9} /> تاريخ البداية</div>
            <div className="text-zinc-200 font-bold">{fmtDate(p.start_date)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={9} /> تاريخ النهاية</div>
            <div className="text-zinc-200 font-bold">{fmtDate(p.end_date)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Clock size={9} /> المدة</div>
            <div className="text-zinc-200 font-bold">
              {p.duration_days ? `${p.duration_days} يوم` : p.duration_hours ? `${p.duration_hours} ساعة` : '-'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Target size={9} /> المقاعد</div>
            <div className="text-zinc-200 font-bold">{fmtNum(p.seats)}</div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-zinc-800 px-5 flex gap-1">
          {[
            { id: 'overview', label: 'نظرة', icon: BarChart3 },
            { id: 'orgs', label: 'الجهات المستفيدة', icon: Building2, count: orgs.length },
            { id: 'beneficiaries', label: 'المرشحون', icon: Users, count: beneficiaries.length },
          ].map((t: any) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)} className={`px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                active ? 'border-purple-500 text-purple-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}>
                <Icon size={12} />{t.label}
                {t.count !== undefined && <span className="text-[9px] bg-zinc-800 px-1 rounded">{t.count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {subTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="المرشحون" value={p.actual_beneficiaries || 0} color="teal" icon={Users} />
                <StatCard label="الجهات" value={p.orgs_served || 0} color="indigo" icon={Building2} />
                <StatCard label="المقاعد" value={p.seats || 0} color="amber" icon={Target} />
              </div>

              {/* Provider/Cost — admin only */}
              {(p.provider || p.total_cost) && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    🔒 معلومات إدارية
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {p.provider && (
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-0.5">الشريك المنفّذ</div>
                        <div className="text-zinc-200 font-bold">{p.provider}</div>
                      </div>
                    )}
                    {p.project && (
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-0.5">المشروع</div>
                        <div className="text-zinc-200 font-bold">{p.project}</div>
                      </div>
                    )}
                    {p.total_cost && (
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-0.5">التكلفة الإجمالية</div>
                        <div className="text-zinc-200 font-bold">{fmtNum(Number(p.total_cost))} ريال</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sectorBreakdown.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-teal-400" />القطاعات المستفيدة</h3>
                  <div className="space-y-2">
                    {sectorBreakdown.map((s: any) => {
                      const max = Math.max(...sectorBreakdown.map((x: any) => x.count));
                      const pct = (s.count / max) * 100;
                      return (
                        <div key={s.sector}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-300">{s.sector}</span>
                            <span className="text-zinc-500 font-mono">{s.count}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetLevels.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2"><GraduationCap size={14} className="text-teal-400" />المستويات المستهدفة</h3>
                  <div className="flex flex-wrap gap-2">
                    {targetLevels.map((tl: any) => (
                      <div key={tl.target_level} className="bg-zinc-950/50 rounded px-3 py-1.5 text-xs">
                        <span className="text-zinc-300">{tl.target_level}</span>
                        <span className="text-purple-300 font-bold mr-2">{tl.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === 'orgs' && (
            <div className="space-y-2">
              {orgs.map((o: any) => (
                <button key={o.id} onClick={() => onOpenOrg(o.id)} className="w-full text-right bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 rounded-lg p-3 transition flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-zinc-100 mb-0.5">{o.name_ar}</div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      {o.sector && <span>{o.sector}</span>}
                      {o.classification && CLASSIFICATION_COLORS[o.classification] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[o.classification]}`}>{o.classification}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold text-teal-300">{o.beneficiaries_count}</div>
                    <div className="text-[10px] text-zinc-500">مرشّح</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {subTab === 'beneficiaries' && <BeneficiariesTable beneficiaries={beneficiaries} />}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROGRAMS TAB — مع click handler
// ════════════════════════════════════════════════════════════════
function ProgramsTab({ selectedProgramId, onSelectProgram, onOpenOrg }: any) {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (year) params.set('year', year);
    if (type) params.set('type', type);
    fetch(`/api/qtech/data-center/programs?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [search, year, type]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في البرامج..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50" />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل السنوات</option>
          {data?.filters?.years?.map((y: number) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل الأنواع</option>
          {data?.filters?.types?.map((t: string) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[11px] text-zinc-500">{data?.programs?.length || 0} نتيجة</span>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={24} /></div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-950/60 text-zinc-500 text-[10px] uppercase">
                <tr>
                  <th className="text-right py-2.5 px-3">البرنامج</th>
                  <th className="text-right py-2.5 px-3">النوع</th>
                  <th className="text-right py-2.5 px-3">السنة</th>
                  <th className="text-right py-2.5 px-3">البلد</th>
                  <th className="text-right py-2.5 px-3">المقاعد</th>
                  <th className="text-right py-2.5 px-3">المرشحون</th>
                  <th className="text-right py-2.5 px-3">الجهات</th>
                  <th className="text-right py-2.5 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {data?.programs?.map((p: any) => (
                  <tr key={p.id} onClick={() => onSelectProgram(p.id)} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition">
                    <td className="py-2.5 px-3 text-zinc-200 font-bold">
                      <div className="line-clamp-1">{p.title}</div>
                      {p.is_high_impact && <span className="mt-0.5 inline-block text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">⭐ HIGH</span>}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.type || '-'}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{p.year || '-'}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.country || '-'}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{p.seats}</td>
                    <td className="py-2.5 px-3 text-teal-300 font-bold font-mono">{p.actual_beneficiaries}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{p.orgs_served}</td>
                    <td className="py-2.5 px-3 text-teal-400"><ExternalLink size={12} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BENEFICIARIES TAB
// ════════════════════════════════════════════════════════════════
function BeneficiariesTab({ onOpenProgram, onOpenOrg }: any) {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (year) params.set('year', year);
    if (target) params.set('target_level', target);
    fetch(`/api/qtech/data-center/beneficiaries?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [search, year, target]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-xs text-zinc-200" />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل السنوات</option>
          {[2026,2025,2024,2023,2022,2021].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200">
          <option value="">كل المستويات</option>
          <option>Experts</option><option>Managers</option><option>Awareness</option><option>High Level</option>
        </select>
        <span className="text-[11px] text-zinc-500">{data?.beneficiaries?.length || 0} نتيجة</span>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={24} /></div> :
        <BeneficiariesTable beneficiaries={data?.beneficiaries || []} onOpenProgram={onOpenProgram} onOpenOrg={onOpenOrg} />}
    </div>
  );
}

function BeneficiariesTable({ beneficiaries, onOpenProgram, onOpenOrg }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-950/60 text-zinc-500 text-[10px] uppercase">
            <tr>
              <th className="text-right py-2.5 px-3">الاسم</th>
              <th className="text-right py-2.5 px-3">المسمى</th>
              <th className="text-right py-2.5 px-3">الجهة</th>
              <th className="text-right py-2.5 px-3">البرنامج</th>
              <th className="text-right py-2.5 px-3">المستوى</th>
              <th className="text-right py-2.5 px-3">السنة</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map((b: any) => (
              <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-2.5 px-3 text-zinc-200 font-bold">{b.name}</td>
                <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{b.job_title || '-'}</td>
                <td className="py-2.5 px-3 text-zinc-300 text-[11px]">
                  {b.org_name && onOpenOrg ? (
                    <button onClick={() => onOpenOrg(b.org_id)} className="hover:text-teal-300 text-right">{b.org_name}</button>
                  ) : b.org_name || '-'}
                </td>
                <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-[200px]">
                  {b.program_title && onOpenProgram && b.program_id ? (
                    <button onClick={() => onOpenProgram(b.program_id)} className="hover:text-purple-300 text-right truncate w-full">{b.program_title}</button>
                  ) : <span className="truncate">{b.program_title || '-'}</span>}
                </td>
                <td className="py-2.5 px-3">
                  {b.target_level && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-300 rounded">{b.target_level}</span>}
                </td>
                <td className="py-2.5 px-3 text-zinc-400 font-mono">{b.year || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LIAISONS TAB
// ════════════════════════════════════════════════════════════════
function LiaisonsTab({ onOpenOrg }: any) {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    fetch(`/api/qtech/data-center/liaisons?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-xs text-zinc-200" />
        </div>
        <span className="text-[11px] text-zinc-500">{data?.liaisons?.length || 0} ضابط</span>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={24} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.liaisons?.map((l: any) => (
            <div key={l.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 hover:border-teal-500/40 transition">
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br from-teal-500 to-emerald-600">
                  {l.name?.split(/\s+/).slice(0, 2).map((s: string) => s[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-100 leading-tight">{l.name}</div>
                  {l.title && <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{l.title}</div>}
                </div>
                {l.inbox_count > 0 && <div className="text-[10px] bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded font-mono">{l.inbox_count}📧</div>}
              </div>
              {l.org_name && (
                <button onClick={() => onOpenOrg(l.org_id)} className="w-full text-right bg-zinc-950/50 hover:bg-zinc-900 rounded p-2 mb-2 transition">
                  <div className="text-[11px] text-zinc-300 font-bold">{l.org_name}</div>
                  {l.org_sector && <div className="text-[10px] text-zinc-500 mt-0.5">{l.org_sector}</div>}
                </button>
              )}
              <div className="space-y-1 text-[11px]">
                {l.email && <div className="flex items-center gap-1.5 text-zinc-400"><Mail size={10} /><span className="truncate" dir="ltr">{l.email}</span></div>}
                {l.phone && l.phone !== 'لايوجد' && <div className="flex items-center gap-1.5 text-zinc-400"><Phone size={10} />{l.phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
