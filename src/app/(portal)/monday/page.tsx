'use client';
import { useState, useEffect, useMemo } from 'react';

interface Board {
  id: string;
  name: string;
  workspace_name: string | null;
  items_count: number;
  synced_items: number;
  url: string | null;
  synced_at: string;
  board_updated_at: string | null;
}

interface Column {
  column_id: string;
  title: string;
  type: string;
  settings: any;
  position: number;
}

interface Item {
  id: number;
  name: string;
  status: string | null;
  status_index: number | null;
  person_name: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  item_updated_at: string | null;
  vals: Record<string, { title: string; type: string; text: string | null }>;
}

const STATUS_COLOR_FALLBACK: Record<string, string> = {
  'مرحلة التنفيذ': '#00c875',
  'تم إرسال الدعوات': '#9d50dd',
  'تم إرسال القبول': '#216edf',
  'تاريخ مؤكد': '#175a63',
  'تاريخ غير مؤكد': '#fdab3d',
  'لم يتم البدء': '#c4c4c4',
  'برنامج منتهي': '#007eb5',
  'تم اغلاق الترشيح': '#df2f4a',
};

function fmtDate(v: any) {
  if (!v) return '—';
  try {
    const d = new Date(v);
    return d.toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return String(v); }
}

function relTime(v: any) {
  if (!v) return '';
  try {
    const d = new Date(v);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return d.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function statusColor(label: string | null, settings: any): string {
  if (!label) return '#c4c4c4';
  // try to find color in board status settings
  if (settings?.labels && settings?.labels_colors) {
    for (const [idx, lbl] of Object.entries(settings.labels)) {
      if (lbl === label) {
        const colorObj = settings.labels_colors[idx];
        if (colorObj?.color) return colorObj.color;
      }
    }
  }
  return STATUS_COLOR_FALLBACK[label] || '#216edf';
}

function StatCard({ icon, label, value, gradient }: any) {
  return (
    <div className="qd-stat-card relative overflow-hidden rounded-2xl border p-5"
         style={{
           background: 'var(--surface, rgba(255,255,255,0.03))',
           borderColor: 'var(--border, rgba(255,255,255,0.08))',
         }}>
      <div className="absolute inset-0 opacity-30" style={{ background: gradient }} />
      <div className="relative">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-xs opacity-70 mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value?.toLocaleString('en-US') ?? '—'}</div>
      </div>
    </div>
  );
}

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  const isSubitems = board.name.startsWith('Subitems of');
  return (
    <button onClick={onClick}
      className="text-right p-5 rounded-2xl border hover:scale-[1.02] hover:shadow-xl transition-all overflow-hidden relative group"
      style={{
        background: 'var(--surface, rgba(255,255,255,0.03))',
        borderColor: 'var(--border, rgba(255,255,255,0.08))',
      }}>
      <div className="absolute top-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all"
           style={{ background: isSubitems ? '#9d50dd' : 'linear-gradient(90deg, #7C32C9, #00ABAF)' }} />
      <div className="text-xs opacity-60 mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        {isSubitems ? '🔗 مهام فرعية' : '📋 لوحة'}
        <span>·</span>
        <span>{relTime(board.board_updated_at)}</span>
      </div>
      <h3 className="font-bold text-base mb-3 line-clamp-2 min-h-[3rem]" style={{ color: 'var(--text)' }}>
        {board.name}
      </h3>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
            {board.synced_items}
          </span>
          <span className="text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>عنصر</span>
        </div>
        <div className="text-xs px-2 py-1 rounded-md" style={{
          background: 'rgba(124,50,201,0.15)',
          color: '#a76eff',
        }}>
          عرض ←
        </div>
      </div>
    </button>
  );
}

export default function MondayPage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<{
    board: any; columns: Column[]; items: Item[]; total: number; pages: number; statuses: { v: string; cnt: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Read URL board param on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const b = url.searchParams.get('board');
    if (b) setSelectedBoardId(b);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setQDebounced(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reset on board change
  useEffect(() => {
    setQ(''); setQDebounced(''); setStatusFilter(''); setPage(1);
  }, [selectedBoardId]);

  // Fetch boards list
  useEffect(() => {
    setLoading(true);
    fetch('/api/monday/data')
      .then(r => r.json())
      .then(d => { setBoards(d.boards); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Fetch board details
  useEffect(() => {
    if (!selectedBoardId) { setBoardData(null); return; }
    setLoading(true);
    const params = new URLSearchParams({
      board: selectedBoardId, page: String(page), limit: '50',
    });
    if (qDebounced) params.set('q', qDebounced);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/monday/data?${params}`)
      .then(r => r.json())
      .then(d => { setBoardData(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('board', selectedBoardId);
    window.history.replaceState({}, '', url.toString());
  }, [selectedBoardId, qDebounced, statusFilter, page]);

  const goBack = () => {
    setSelectedBoardId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('board');
    window.history.replaceState({}, '', url.toString());
  };

  const stats = useMemo(() => {
    if (!boards) return null;
    const total = boards.reduce((s, b) => s + b.synced_items, 0);
    const main = boards.filter(b => !b.name.startsWith('Subitems of')).length;
    const sub = boards.filter(b => b.name.startsWith('Subitems of')).length;
    return { total, main, sub, count: boards.length };
  }, [boards]);

  const statusSettings = useMemo(() => {
    if (!boardData) return null;
    const statusCol = boardData.columns.find(c => c.type === 'status');
    return statusCol?.settings || null;
  }, [boardData]);

  // ─── Board details view ───
  if (selectedBoardId && boardData) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto" dir="rtl">
        <button onClick={goBack}
          className="mb-4 text-sm flex items-center gap-1 opacity-70 hover:opacity-100"
          style={{ color: 'var(--text)' }}>
          ← العودة لكل اللوحات
        </button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {boardData.board?.name}
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--text-muted)' }}>
            {boardData.total} عنصر · آخر مزامنة {relTime(boardData.board?.synced_at)}
          </p>
        </div>

        {/* Status distribution */}
        {boardData.statuses?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!statusFilter ? 'shadow' : 'hover:opacity-80'}`}
              style={{
                background: !statusFilter ? 'linear-gradient(135deg, #7C32C9, #00ABAF)' : 'transparent',
                borderColor: 'var(--border)',
                color: !statusFilter ? '#fff' : 'var(--text)',
              }}>
              الكل ({boardData.total})
            </button>
            {boardData.statuses.map(s => {
              const color = statusColor(s.v, statusSettings);
              const active = statusFilter === s.v;
              return (
                <button key={s.v} onClick={() => { setStatusFilter(active ? '' : s.v); setPage(1); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${active ? 'shadow' : 'hover:opacity-80'}`}
                  style={{
                    background: active ? color : `${color}20`,
                    borderColor: active ? color : `${color}40`,
                    color: active ? '#fff' : color,
                  }}>
                  {s.v} ({s.cnt})
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="rounded-xl border p-3 mb-4 flex flex-wrap gap-2 items-center"
             style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
          <div className="relative flex-1 min-w-[200px]">
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="🔍 بحث بالاسم أو الشخص المسؤول..."
              className="w-full bg-transparent text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))', color: 'var(--text)' }} />
          </div>
          {(q || statusFilter) && (
            <button onClick={() => { setQ(''); setStatusFilter(''); setPage(1); }}
              className="text-xs px-3 py-2 rounded-lg border opacity-70 hover:opacity-100"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>✕ مسح</button>
          )}
          <div className="text-xs opacity-60 mr-auto" style={{ color: 'var(--text-muted)' }}>
            {boardData.items.length} من {boardData.total}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-xl border overflow-hidden"
             style={{ background: 'var(--surface, rgba(255,255,255,0.03))', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
          {loading && <div className="h-1 bg-gradient-to-l from-purple-500 to-teal-500 animate-pulse" />}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                <tr>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>المسؤول</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>التواريخ</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {boardData.items.length ? boardData.items.map((it) => {
                  const sColor = statusColor(it.status, statusSettings);
                  return (
                    <tr key={it.id} className="border-t hover:bg-white/[0.02] transition-colors"
                        style={{ borderColor: 'var(--border, rgba(255,255,255,0.05))' }}>
                      <td className="px-4 py-3 max-w-[400px]">
                        <div className="font-medium line-clamp-2" style={{ color: 'var(--text)' }} title={it.name}>{it.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {it.status ? (
                          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium" style={{
                            background: `${sColor}25`,
                            color: sColor,
                            border: `1px solid ${sColor}50`,
                          }}>{it.status}</span>
                        ) : <span className="text-xs opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text)' }}>
                        {it.person_name || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                        {it.timeline_start ? `${fmtDate(it.timeline_start)} → ${fmtDate(it.timeline_end)}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                        {relTime(it.item_updated_at)}
                      </td>
                    </tr>
                  );
                }) : !loading && (
                  <tr><td colSpan={5} className="text-center py-12 opacity-60" style={{ color: 'var(--text-muted)' }}>لا توجد نتائج</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {boardData.pages > 1 && (
            <div className="flex items-center justify-between p-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-30"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>← السابق</button>
              <div className="text-sm tabular-nums opacity-70" style={{ color: 'var(--text-muted)' }}>
                صفحة {page} من {boardData.pages}
              </div>
              <button onClick={() => setPage(p => Math.min(boardData.pages, p + 1))} disabled={page >= boardData.pages}
                className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-30"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>التالي →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Boards list view ───
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text)' }}>
          <span>Monday.com</span>
          <span className="text-sm font-normal opacity-60">— إدارة المهارات الرقمية</span>
        </h1>
        <p className="text-sm opacity-70" style={{ color: 'var(--text-muted)' }}>
          عرض موحّد لكل اللوحات والعناصر — يتزامن تلقائياً من Monday.com
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon="📋" label="إجمالي اللوحات" value={stats.count}
            gradient="radial-gradient(circle at top right, rgba(124,50,201,0.4), transparent 70%)" />
          <StatCard icon="📂" label="لوحات رئيسية" value={stats.main}
            gradient="radial-gradient(circle at top right, rgba(0,171,175,0.4), transparent 70%)" />
          <StatCard icon="🔗" label="مهام فرعية" value={stats.sub}
            gradient="radial-gradient(circle at top right, rgba(244,114,182,0.4), transparent 70%)" />
          <StatCard icon="📊" label="إجمالي العناصر" value={stats.total}
            gradient="radial-gradient(circle at top right, rgba(251,191,36,0.4), transparent 70%)" />
        </div>
      )}

      {loading && !boards && (
        <div className="text-center py-12 opacity-60" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
      )}

      {boards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(b => (
            <BoardCard key={b.id} board={b} onClick={() => setSelectedBoardId(b.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
