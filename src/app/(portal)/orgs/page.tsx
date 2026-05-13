'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Building2, Users, Award, Loader2 } from 'lucide-react';

interface Org {
  id: number;
  name_ar: string;
  name_en: string | null;
  short_name: string | null;
  org_type: string | null;
  sector: string | null;
  classification: string | null;
  is_internal: boolean;
  people_count: number;
  liaison_count: number;
  qiyas_score: number | null;
}

interface ApiResponse {
  ok: boolean;
  rows: Org[];
  total: number;
  facets: { sectors: string[]; types: string[] };
}

const SECTOR_LABELS: Record<string, string> = {
  digital: '🖥️ رقمي',
  health: '🏥 صحي',
  education: '🎓 تعليم',
  finance: '💰 مالي',
  economy: '📈 اقتصاد',
  energy: '⚡ طاقة',
  defense: '🛡️ دفاع',
  social: '🤝 اجتماعي',
  legal: '⚖️ قانوني',
  agriculture: '🌾 زراعة',
  industry: '🏭 صناعة',
  general: '📋 عام',
};

const TYPE_LABELS: Record<string, string> = {
  ministry: 'وزارة',
  gov_authority: 'جهة حكومية',
  fund: 'صندوق',
  company: 'شركة',
  ngo: 'منظمة غير ربحية',
  private: 'قطاع خاص',
};

function getQiyasBadge(score: number | null): { color: string; label: string } | null {
  if (score === null || score === undefined) return null;
  if (score >= 90) return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'متميز' };
  if (score >= 80) return { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'متقدم' };
  if (score >= 70) return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'متطور' };
  if (score >= 60) return { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'مكتمل' };
  return { color: 'bg-gray-50 text-gray-600 border-gray-200', label: 'مؤسس' };
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [orgType, setOrgType] = useState('');
  const [facets, setFacets] = useState({ sectors: [] as string[], types: [] as string[] });
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.set('search', search);
    if (sector) params.set('sector', sector);
    if (orgType) params.set('type', orgType);
    
    const res = await fetch(`/api/orgs?${params}`);
    const data: ApiResponse = await res.json();
    if (data.ok) {
      setOrgs(data.rows);
      setTotal(data.total);
      setFacets(data.facets);
    }
    setLoading(false);
  }, [search, sector, orgType, offset]);

  useEffect(() => {
    const t = setTimeout(fetchOrgs, 250);
    return () => clearTimeout(t);
  }, [fetchOrgs]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto" dir="rtl">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏛️ الجهات والمنظمات</h1>
          <p className="text-gray-600 mt-1">{total} جهة في النظام البيئي</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن جهة..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={sector}
          onChange={(e) => { setSector(e.target.value); setOffset(0); }}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="">كل القطاعات</option>
          {facets.sectors.map(s => (
            <option key={s} value={s}>{SECTOR_LABELS[s] || s}</option>
          ))}
        </select>
        <select
          value={orgType}
          onChange={(e) => { setOrgType(e.target.value); setOffset(0); }}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="">كل الأنواع</option>
          {facets.types.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">لا توجد جهات مطابقة</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgs.map(o => {
              const badge = getQiyasBadge(o.qiyas_score);
              return (
                <Link
                  key={o.id}
                  href={`/orgs/${o.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                        {o.name_ar}
                      </h3>
                      {o.name_en && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{o.name_en}</p>
                      )}
                    </div>
                    {badge && (
                      <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
                        {badge.label} {o.qiyas_score?.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {o.sector && (
                      <span className="px-2 py-1 bg-gray-50 rounded">
                        {SECTOR_LABELS[o.sector] || o.sector}
                      </span>
                    )}
                    {o.org_type && (
                      <span className="px-2 py-1 bg-gray-50 rounded">
                        {TYPE_LABELS[o.org_type] || o.org_type}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{o.people_count}</span>
                      <span className="text-gray-500">شخص</span>
                    </div>
                    {o.liaison_count > 0 && (
                      <div className="flex items-center gap-1 text-emerald-700">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">{o.liaison_count}</span>
                        <span className="text-gray-500">ضابط اتصال</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >السابق</button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {offset + 1}–{Math.min(offset + limit, total)} من {total}
              </span>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
