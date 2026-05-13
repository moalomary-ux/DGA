'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Award, Loader2, Star, Mail, Phone, Building2 } from 'lucide-react';

interface Org {
  id: number;
  name_ar: string;
  name_en: string | null;
  short_name: string | null;
  org_type: string | null;
  sector: string | null;
  classification: string | null;
  domain: string | null;
  is_internal: boolean;
  notes: string | null;
}
interface Person {
  id: number;
  full_name_ar: string;
  full_name_en: string | null;
  primary_email: string | null;
  phone: string | null;
  job_title_ar: string | null;
  role_category: string | null;
  relationship_to_mohammed: string | null;
  importance: number | null;
  region: string | null;
}
interface Metric {
  metric_type: string;
  metric_label: string;
  numeric_value: number | null;
  text_value: string | null;
  year: number;
}
interface Program {
  id: number;
  title_ar: string;
  category: string | null;
  program_type: string | null;
  start_date: string | null;
  attendees_from_org: number;
}

const ROLE_LABEL: Record<string, { ar: string; color: string }> = {
  liaison_officer: { ar: 'ضابط اتصال', color: 'bg-emerald-100 text-emerald-700' },
  trainee: { ar: 'متدرب', color: 'bg-blue-100 text-blue-700' },
  leadership: { ar: 'قيادي', color: 'bg-purple-100 text-purple-700' },
  default: { ar: 'موظف', color: 'bg-gray-100 text-gray-700' },
};

export default function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{
    org: Org; people: Person[]; metrics: Metric[]; programs: Program[];
    stats: { total_people: number; liaison_count: number; trainee_count: number; programs_count: number };
  } | null>(null);
  const [tab, setTab] = useState<'people' | 'programs' | 'metrics'>('people');
  const [peopleSearch, setPeopleSearch] = useState('');

  useEffect(() => {
    fetch(`/api/orgs/${id}`).then(r => r.json()).then(d => { if (d.ok) setData(d); });
  }, [id]);

  if (!data) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  const { org, people, metrics, programs, stats } = data;
  const filteredPeople = peopleSearch
    ? people.filter(p => 
        p.full_name_ar?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
        p.primary_email?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
        p.job_title_ar?.toLowerCase().includes(peopleSearch.toLowerCase())
      )
    : people;

  const qiyasMetric = metrics.find(m => m.metric_type === 'qiyas');

  return (
    <div className="p-6 max-w-[1400px] mx-auto" dir="rtl">
      <Link href="/orgs" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 mb-4">
        <ArrowRight className="h-4 w-4" /> رجوع للقائمة
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-50 to-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{org.name_ar}</h1>
            {org.name_en && <p className="text-lg text-gray-500 mt-1">{org.name_en}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {org.sector && <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">{org.sector}</span>}
              {org.org_type && <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">{org.org_type}</span>}
              {org.classification && <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">{org.classification}</span>}
              {org.is_internal && <span className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full">داخلي</span>}
            </div>
            {org.domain && <p className="text-sm text-gray-600 mt-3">🌐 {org.domain}</p>}
          </div>
          {qiyasMetric?.numeric_value && (
            <div className="text-center bg-white rounded-xl border border-gray-200 px-6 py-4">
              <div className="text-3xl font-bold text-blue-600">{qiyasMetric.numeric_value.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">قياس {qiyasMetric.year}</div>
              {qiyasMetric.text_value && (
                <div className="text-xs text-gray-700 mt-1">{qiyasMetric.text_value}</div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total_people}</div>
            <div className="text-xs text-gray-500">إجمالي الأشخاص</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-emerald-600">{stats.liaison_count}</div>
            <div className="text-xs text-gray-500">ضباط الاتصال</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.trainee_count}</div>
            <div className="text-xs text-gray-500">متدربين</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl font-bold text-purple-600">{stats.programs_count}</div>
            <div className="text-xs text-gray-500">برامج تدريبية</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-1">
          {[
            { key: 'people', label: `الأشخاص (${stats.total_people})`, icon: Users },
            { key: 'programs', label: `البرامج (${stats.programs_count})`, icon: Award },
            { key: 'metrics', label: `المقاييس (${metrics.length})`, icon: Star },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
                  tab === t.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'people' && (
        <div>
          <input
            type="text"
            placeholder="ابحث في الأشخاص..."
            value={peopleSearch}
            onChange={(e) => setPeopleSearch(e.target.value)}
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPeople.map(p => {
              const role = ROLE_LABEL[p.role_category || 'default'] || ROLE_LABEL.default;
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{p.full_name_ar}</div>
                      {p.job_title_ar && <div className="text-sm text-gray-600 mt-0.5 truncate">{p.job_title_ar}</div>}
                    </div>
                    <span className={`shrink-0 px-2 py-1 text-xs rounded ${role.color}`}>{role.ar}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    {p.primary_email && (
                      <a href={`mailto:${p.primary_email}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Mail className="h-3 w-3" /> {p.primary_email}
                      </a>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {p.phone}
                      </div>
                    )}
                    {p.region && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {p.region}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'programs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right">البرنامج</th>
                <th className="px-4 py-3 text-right">التصنيف</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programs.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title_ar}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.program_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.start_date?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{p.attendees_from_org}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">لا توجد مقاييس مسجّلة</div>
          ) : metrics.map((m, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">{m.metric_type} • {m.year}</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">{m.metric_label}</div>
              {m.numeric_value !== null && (
                <div className="text-3xl font-bold text-blue-600 mt-2">{Number(m.numeric_value).toFixed(2)}</div>
              )}
              {m.text_value && <div className="text-sm text-gray-700 mt-1">{m.text_value}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
