'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Inbox, AlertCircle, Star, Archive, Trash2, Search,
  Reply, ReplyAll, Forward, Mail, CheckCircle, Circle, Loader2, Send,
  FileText, X, RefreshCw, Plus, Phone, Award, Briefcase, ExternalLink,
  Sparkles, Building2, PanelRightOpen, PanelRightClose, ChevronDown, ChevronUp,
  Shield, UserCheck, Users, Globe
} from 'lucide-react';
import { processEmailBody } from './emailBody';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════
interface InboxMessage {
  id: number;
  apple_msg_id: string | null;
  from_addr: string;
  from_name: string | null;
  subject: string;
  body_text?: string;
  body_html?: string;
  received_at: string;
  status: string;
  program_id: number | null;
  program_title: string | null;
  liaison_id?: number | null;
  liaison_name?: string | null;
  liaison_title?: string | null;
  liaison_org_name?: string | null;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════
const STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  new: { ar: 'جديد', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  read: { ar: 'مقروء', color: 'bg-zinc-700/40 text-zinc-400 border-zinc-700/40' },
  flagged: { ar: 'مهم', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  replied: { ar: 'تم الرد', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  archived: { ar: 'مؤرشف', color: 'bg-zinc-700/40 text-zinc-400 border-zinc-700/40' },
};

const SENDER_TYPES: Record<string, { label: string; color: string; icon: any }> = {
  liaison: { label: 'ضابط اتصال', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: Shield },
  beneficiary: { label: 'مستفيد', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: UserCheck },
  govt: { label: 'جهة حكومية', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Building2 },
  external: { label: 'خارجي', color: 'bg-zinc-700/40 text-zinc-300 border-zinc-700', icon: Globe },
};

// ════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const clean = name.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.substring(0, 2).toUpperCase();
}

const PALETTE = ['#dc2626','#7c3aed','#0891b2','#16a34a','#ea580c','#db2777','#0d9488','#a855f7','#1d4ed8','#15803d'];
function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function parseSender(addr: string, fallbackName: string | null): { name: string; email: string } {
  if (!addr) return { name: fallbackName || '?', email: '' };
  const m = addr.match(/^"?([^"<]+?)"?\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  if (addr.includes('@')) return { name: fallbackName || addr.split('@')[0], email: addr };
  return { name: fallbackName || addr, email: '' };
}

function cleanSubject(subject: string): string {
  if (!subject) return '(بدون موضوع)';
  return subject
    .replace(/\[EXTERNAL\]\s*EXTRNAL[:\s]*/gi, '')
    .replace(/^\s*EXTRNAL[:\s]+/gi, '')
    .replace(/\[EXTERNAL\][:\s]*/gi, '')
    .replace(/\s+/g, ' ').trim() || '(بدون موضوع)';
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
export default function InboxView({
  initialMessages, onCompose, onReply,
}: {
  initialMessages: InboxMessage[];
  onCompose?: () => void;
  onReply?: (msg: InboxMessage) => void;
}) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<number | null>(initialMessages[0]?.id || null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'flagged' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ message: InboxMessage; liaison: any; sender: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showLiaisonPanel, setShowLiaisonPanel] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);

  const filteredMessages = useMemo(() => {
    let m = messages;
    if (filter === 'unread') m = m.filter((x) => x.status === 'new');
    else if (filter === 'flagged') m = m.filter((x) => x.status === 'flagged');
    else if (filter === 'replied') m = m.filter((x) => x.status === 'replied');
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      m = m.filter((x) =>
        x.subject?.toLowerCase().includes(s) ||
        x.from_addr?.toLowerCase().includes(s) ||
        x.liaison_name?.toLowerCase().includes(s) ||
        x.liaison_org_name?.toLowerCase().includes(s)
      );
    }
    return m;
  }, [messages, filter, search]);

  const counts = useMemo(() => ({
    all: messages.length,
    unread: messages.filter((m) => m.status === 'new').length,
    flagged: messages.filter((m) => m.status === 'flagged').length,
    replied: messages.filter((m) => m.status === 'replied').length,
  }), [messages]);

  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    setDetail(null);
    setShowQuoted(false);
    fetch(`/api/qtech/inbox/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setDetail({ message: data.message, liaison: data.liaison, sender: data.sender });
          if (data.message.status === 'new') {
            fetch(`/api/qtech/inbox/${selectedId}`, {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'mark_read' }),
            });
            setMessages((prev) => prev.map((m) => (m.id === selectedId ? { ...m, status: 'read' } : m)));
          }
        }
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/qtech/inbox?limit=200');
      const data = await r.json();
      if (data.messages) setMessages(data.messages.filter((m: any) => m.status !== 'archived'));
    } finally { setLoading(false); }
  };

  // ── معالجة الجسم ──
  const bodyData = useMemo(() => {
    if (!detail?.message) return { originalHtml: '', quotedHtml: '', hasQuoted: false };
    return processEmailBody(detail.message);
  }, [detail?.message?.id]);

  const senderType = detail?.sender?.type || 'external';
  const senderBadge = SENDER_TYPES[senderType];

  return (
    <div
      className="grid bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden h-[calc(100vh-160px)]"
      style={{
        gridTemplateColumns: showLiaisonPanel
          ? '140px 280px minmax(0, 1fr) 300px'
          : '140px 280px minmax(0, 1fr)',
      }}
      dir="rtl"
    >
      {/* ════ COLUMN 1: FILTERS ════ */}
      <div className="bg-zinc-900/40 border-l border-zinc-800 flex flex-col p-2">
        <button
          onClick={onCompose}
          className="w-full mb-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
        >
          <Plus size={13} /> إيميل جديد
        </button>

        <div className="text-[9px] font-bold text-zinc-500 px-2 mb-1 uppercase tracking-wider">الفلتر</div>
        <div className="space-y-0.5 mb-3">
          {[
            { k: 'all', label: 'الكل', icon: Inbox, count: counts.all },
            { k: 'unread', label: 'غير مقروء', icon: Circle, count: counts.unread },
            { k: 'flagged', label: 'مهم', icon: Star, count: counts.flagged },
            { k: 'replied', label: 'تم الرد', icon: CheckCircle, count: counts.replied },
          ].map((it: any) => {
            const Icon = it.icon;
            const active = filter === it.k;
            return (
              <button
                key={it.k}
                onClick={() => setFilter(it.k)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition ${
                  active ? 'bg-teal-500/20 text-teal-200 font-bold' : 'text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={11} /><span>{it.label}</span>
                </div>
                {it.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                    active ? 'bg-teal-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>{it.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[9px] font-bold text-zinc-500 px-2 mb-1 uppercase tracking-wider">المجلدات</div>
        <div className="space-y-0.5 mb-auto">
          {[
            { label: 'الوارد', icon: Inbox },
            { label: 'الصادر', icon: Send },
            { label: 'المسودات', icon: FileText },
            { label: 'المؤرشف', icon: Archive },
          ].map((it: any, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer">
                <Icon size={10} /><span>{it.label}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="mt-2 w-full bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 rounded-md py-1.5 text-[10px] font-bold flex items-center justify-center gap-1"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />تحديث
        </button>
      </div>

      {/* ════ COLUMN 2: EMAIL LIST ════ */}
      <div className="bg-zinc-900/30 border-l border-zinc-800 flex flex-col overflow-hidden">
        <div className="p-2 border-b border-zinc-800 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-md pr-8 pl-3 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filteredMessages.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-16">
              <Inbox size={28} className="mx-auto mb-2 opacity-30" />لا توجد رسائل
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isSelected = selectedId === m.id;
              const isUnread = m.status === 'new';
              const sender = parseSender(m.from_addr, m.liaison_name || m.from_name);
              const ringColor = colorFor(sender.name);

              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-right px-2.5 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition relative ${
                    isSelected ? 'bg-teal-500/5 border-r-2 border-r-teal-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ringColor }}>
                        {getInitials(sender.name)}
                      </div>
                      {m.liaison_id && <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-zinc-950" title="ضابط اتصال" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className={`text-[12px] truncate ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-300'}`}>
                          {m.liaison_name || sender.name}
                        </div>
                        <div className="text-[9px] text-zinc-500 whitespace-nowrap">{timeAgo(m.received_at)}</div>
                      </div>
                      <div className={`text-[11px] mb-0.5 truncate leading-snug ${isUnread ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        {cleanSubject(m.subject)}
                      </div>
                      {m.liaison_org_name && (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] px-1 py-0.5 bg-teal-500/10 text-teal-300 rounded flex items-center gap-0.5 max-w-full">
                            <Building2 size={7} />
                            <span className="truncate text-[8px]">{m.liaison_org_name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ════ COLUMN 3: EMAIL BODY (WIDE) ════ */}
      <div className="bg-zinc-950 flex flex-col overflow-hidden min-w-0">
        {!detail && !detailLoading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <Mail size={48} className="mx-auto mb-3 opacity-20" />
              <div className="text-sm">اختر رسالة</div>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-teal-500" size={28} />
          </div>
        ) : detail ? (
          <>
            {/* ── Top Toolbar ── */}
            <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between bg-zinc-900/30 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onReply?.(detail.message)}
                  className="bg-teal-500 hover:bg-teal-400 text-zinc-950 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5"
                >
                  <Reply size={12} /> رد
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1.5 rounded-md text-[11px] flex items-center gap-1">
                  <ReplyAll size={11} /> رد على الكل
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1.5 rounded-md text-[11px] flex items-center gap-1">
                  <Forward size={11} /> توجيه
                </button>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                <button className="p-1.5 text-zinc-500 hover:text-yellow-400 hover:bg-zinc-800 rounded-md"><Star size={12} /></button>
                <button className="p-1.5 text-zinc-500 hover:bg-zinc-800 rounded-md"><Archive size={12} /></button>
                <button className="p-1.5 text-zinc-500 hover:bg-zinc-800 rounded-md"><Trash2 size={12} /></button>
              </div>
              <button
                onClick={() => setShowLiaisonPanel(!showLiaisonPanel)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition ${
                  showLiaisonPanel ? 'bg-teal-500/15 text-teal-300' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                {showLiaisonPanel ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
                {senderType === 'liaison' ? 'بطاقة ضابط' : senderType === 'beneficiary' ? 'بطاقة مستفيد' : 'البطاقة'}
              </button>
            </div>

            {/* ── Email Header ── */}
            <div className="border-b border-zinc-800 px-6 py-4 bg-zinc-950 flex-shrink-0">
              <h1 className="text-[22px] font-bold text-zinc-100 leading-snug mb-3" style={{ letterSpacing: '-0.01em' }}>
                {cleanSubject(detail.message.subject)}
              </h1>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: colorFor(detail.liaison?.name || detail.message.from_addr) }}
                  >
                    {getInitials(detail.liaison?.name || detail.message.from_name || detail.message.from_addr)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="text-[14px] font-bold text-zinc-100">
                        {detail.liaison?.name || detail.message.from_name || parseSender(detail.message.from_addr, null).name}
                      </div>
                      {senderBadge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${senderBadge.color}`}>
                          <senderBadge.icon size={10} />{senderBadge.label}
                        </span>
                      )}
                      {detail.sender?.org_name && (
                        <span className="text-[10px] text-zinc-500">من <span className="text-zinc-300">{detail.sender.org_name}</span></span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
                      <span dir="ltr">{parseSender(detail.message.from_addr, null).email}</span>
                      <span className="text-zinc-700">←</span>
                      <span dir="ltr">q-tech@dga.gov.sa</span>
                    </div>
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-[11px] text-zinc-500">{formatFullDate(detail.message.received_at)}</div>
                  {STATUS_LABELS[detail.message.status] && (
                    <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-md border ${STATUS_LABELS[detail.message.status].color}`}>
                      {STATUS_LABELS[detail.message.status].ar}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ★★★ EMAIL BODY — FULL WIDTH + SCROLL ★★★ */}
            <div className="flex-1 overflow-y-auto bg-zinc-950" style={{ scrollbarWidth: 'thin' }}>
              <div className="px-6 py-5">
                {/* Original message */}
                <article className="email-body" dangerouslySetInnerHTML={{ __html: bodyData.originalHtml }} />

                {/* Quoted/forwarded text — collapsible */}
                {bodyData.hasQuoted && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowQuoted(!showQuoted)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 transition"
                    >
                      {showQuoted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      <span>{showQuoted ? 'إخفاء' : 'إظهار'} الرسائل السابقة</span>
                    </button>
                    {showQuoted && (
                      <div className="mt-3 border-r-2 border-zinc-700 pr-4 mr-1 opacity-75">
                        <article className="email-body email-body-quoted" dangerouslySetInnerHTML={{ __html: bodyData.quotedHtml }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ★★★ STYLES ★★★ */}
            <style jsx global>{`
              .email-body {
                max-width: none;
                color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Naskh Arabic", "Tahoma", Arial, sans-serif;
                font-size: 16.5px;
                line-height: 2.05;
                direction: rtl;
                letter-spacing: 0.005em;
                word-spacing: 0.03em;
                font-feature-settings: "kern", "liga", "calt";
                text-align: right;
              }
              .email-body p {
                margin: 0 0 1.5em 0;
                color: #f1f5f9;
              }
              .email-body p:last-child { margin-bottom: 0; }
              .email-body a {
                color: #2dd4bf;
                text-decoration: none;
                border-bottom: 1px dotted rgba(45, 212, 191, 0.4);
              }
              .email-body a:hover {
                border-bottom-style: solid;
                color: #5eead4;
              }
              .email-body strong, .email-body b {
                color: #f4f4f5;
                font-weight: 700;
              }
              .email-body ul, .email-body ol {
                margin: 0.8em 1.5em 0.8em 0;
                padding-right: 0.5em;
              }
              .email-body li {
                margin: 0.3em 0;
                line-height: 1.75;
              }
              .email-body h1, .email-body h2, .email-body h3 {
                color: #f4f4f5;
                font-weight: 700;
                margin: 1.3em 0 0.5em 0;
                line-height: 1.4;
              }
              .email-body h1 { font-size: 1.5em; }
              .email-body h2 { font-size: 1.3em; }
              .email-body h3 { font-size: 1.1em; }
              .email-body blockquote {
                border-right: 3px solid #3f3f46;
                padding: 0.4em 1em 0.4em 0;
                margin: 0.8em 0;
                color: #a1a1aa;
                background: rgba(63, 63, 70, 0.15);
                border-radius: 0 6px 6px 0;
              }
              .email-body img {
                max-width: 100%;
                height: auto;
                border-radius: 6px;
                margin: 0.8em 0;
              }
              .email-body table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.8em 0;
              }
              .email-body table td, .email-body table th {
                border: 1px solid #3f3f46;
                padding: 0.5em 0.8em;
              }
              .email-body table th {
                background: rgba(63, 63, 70, 0.3);
                font-weight: 700;
              }
              .email-body hr {
                border: none;
                border-top: 1px solid #3f3f46;
                margin: 1.5em 0;
              }
              .email-body code {
                background: #27272a;
                padding: 0.15em 0.4em;
                border-radius: 4px;
                font-size: 0.9em;
              }
              .email-body pre {
                background: #18181b;
                padding: 1em;
                border-radius: 6px;
                overflow-x: auto;
                font-size: 0.9em;
                line-height: 1.5;
              }
              /* Quoted style */
              .email-body-quoted {
                font-size: 13.5px;
                color: #a1a1aa;
              }
              .email-body-quoted p { color: #a1a1aa; }
              .email-body-quoted a { color: #5eead4; }
            `}</style>
          </>
        ) : null}
      </div>

      {/* ════ COLUMN 4: SIDE PANEL (LIAISON OR BENEFICIARY) ════ */}
      {showLiaisonPanel && detail && (
        <div className="bg-zinc-900/40 border-r border-zinc-800 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {senderType === 'liaison' && detail.liaison ? (
            <LiaisonPanel liaison={detail.liaison} fromEmail={detail.message.from_addr} />
          ) : senderType === 'beneficiary' && detail.sender?.beneficiary ? (
            <BeneficiaryPanel beneficiary={detail.sender.beneficiary} fromEmail={detail.message.from_addr} />
          ) : (
            <UnknownSenderPanel message={detail.message} senderInfo={detail.sender} />
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LIAISON PANEL
// ════════════════════════════════════════════════════════════════
function LiaisonPanel({ liaison, fromEmail }: { liaison: any; fromEmail: string }) {
  const ringColor = colorFor(liaison.name);
  const utilization = liaison.org_quota ? Math.min(100, ((liaison.org_beneficiaries || 0) / liaison.org_quota) * 100) : 0;
  return (
    <div className="text-xs" dir="rtl">
      <div className="bg-gradient-to-bl from-teal-500/10 to-transparent border-b border-zinc-800 p-3">
        <div className="flex items-center gap-1.5 text-teal-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
          <Shield size={11} /><span>ضابط اتصال معتمد</span>
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: ringColor }}>
            {getInitials(liaison.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-zinc-100 leading-tight mb-0.5">{liaison.name}</div>
            {liaison.title && <div className="text-[10px] text-zinc-400 leading-snug line-clamp-2">{liaison.title}</div>}
          </div>
        </div>
      </div>

      {liaison.org_name && (
        <div className="border-b border-zinc-800 p-3">
          <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">الجهة</div>
          <a href={`/data-center?org=${liaison.org_id}`} className="block text-[12px] font-bold text-zinc-100 leading-tight mb-1.5 hover:text-teal-300">
            {liaison.org_name}<ExternalLink size={9} className="inline mr-1 opacity-50" />
          </a>
        </div>
      )}

      <div className="border-b border-zinc-800 p-3">
        <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">الاتصال</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <Mail size={10} className="text-zinc-500" />
            <span className="truncate text-[10px]" dir="ltr">{liaison.email || fromEmail}</span>
          </div>
          {liaison.phone && liaison.phone !== 'لايوجد' && (
            <div className="flex items-center gap-1.5 text-zinc-200">
              <Phone size={10} className="text-zinc-500" /><span>{liaison.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-800 p-2.5 grid grid-cols-3 gap-1.5 text-center">
        <div><div className="text-sm font-bold text-teal-300">{liaison.inbox_count || 0}</div><div className="text-[9px] text-zinc-500">إيميل</div></div>
        <div><div className="text-sm font-bold text-blue-300">{liaison.org_beneficiaries || 0}</div><div className="text-[9px] text-zinc-500">مستفيد</div></div>
        <div><div className="text-sm font-bold text-purple-300">{liaison.org_programs_count || 0}</div><div className="text-[9px] text-zinc-500">برنامج</div></div>
      </div>

      {liaison.org_quota > 0 && (
        <div className="border-b border-zinc-800 p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold text-zinc-500">الحصة السنوية</div>
            <div className="text-[10px] font-bold text-zinc-300">{utilization.toFixed(0)}%</div>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${utilization}%` }} />
          </div>
        </div>
      )}

      {liaison.recent_programs?.length > 0 && (
        <div className="p-3">
          <div className="text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">البرامج الأخيرة</div>
          <div className="space-y-1.5">
            {liaison.recent_programs.slice(0, 3).map((p: any) => (
              <a key={p.id} href={`/data-center?program=${p.id}`} className="block bg-zinc-950/50 hover:bg-zinc-900 rounded p-2 text-[10px] transition">
                <div className="text-zinc-200 leading-tight line-clamp-2">{p.title}</div>
                <div className="text-[9px] text-zinc-500 mt-0.5">{p.year} · {p.beneficiaries_count} مرشّح</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BENEFICIARY PANEL — جديد
// ════════════════════════════════════════════════════════════════
function BeneficiaryPanel({ beneficiary, fromEmail }: { beneficiary: any; fromEmail: string }) {
  const ringColor = colorFor(beneficiary.name);
  return (
    <div className="text-xs" dir="rtl">
      <div className="bg-gradient-to-bl from-purple-500/10 to-transparent border-b border-zinc-800 p-3">
        <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
          <UserCheck size={11} /><span>مستفيد سابق</span>
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: ringColor }}>
            {getInitials(beneficiary.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-zinc-100 leading-tight mb-0.5">{beneficiary.name}</div>
            {beneficiary.job_title && <div className="text-[10px] text-zinc-400 leading-snug line-clamp-2">{beneficiary.job_title}</div>}
          </div>
        </div>
      </div>

      {beneficiary.org_name && (
        <div className="border-b border-zinc-800 p-3">
          <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">الجهة</div>
          <div className="text-[12px] font-bold text-zinc-100">{beneficiary.org_name}</div>
          {beneficiary.org_sector && <div className="text-[10px] text-zinc-500 mt-0.5">{beneficiary.org_sector}</div>}
        </div>
      )}

      <div className="border-b border-zinc-800 p-3">
        <div className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">الاتصال</div>
        <div className="flex items-center gap-1.5 text-zinc-200 text-[11px]">
          <Mail size={10} className="text-zinc-500" />
          <span className="truncate text-[10px]" dir="ltr">{beneficiary.email || fromEmail}</span>
        </div>
      </div>

      {(beneficiary.target_level || beneficiary.last_program_title) && (
        <div className="p-3">
          <div className="text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">الاستفادة</div>
          {beneficiary.target_level && (
            <div className="bg-zinc-950/50 rounded p-2 mb-1.5">
              <div className="text-[9px] text-zinc-500 mb-0.5">المستوى</div>
              <div className="text-[11px] text-zinc-200 font-bold">{beneficiary.target_level}</div>
            </div>
          )}
          {beneficiary.last_program_title && (
            <div className="bg-zinc-950/50 rounded p-2">
              <div className="text-[9px] text-zinc-500 mb-0.5">آخر برنامج</div>
              <div className="text-[11px] text-zinc-200 leading-tight line-clamp-2">{beneficiary.last_program_title}</div>
              {beneficiary.year && <div className="text-[9px] text-zinc-500 mt-0.5">{beneficiary.year}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// UNKNOWN SENDER PANEL
// ════════════════════════════════════════════════════════════════
function UnknownSenderPanel({ message, senderInfo }: { message: InboxMessage; senderInfo: any }) {
  const sender = parseSender(message.from_addr, message.from_name);
  const domain = sender.email.split('@')[1] || '';
  const ringColor = colorFor(sender.name);
  const isGovt = senderInfo?.type === 'govt';
  
  return (
    <div className="text-xs" dir="rtl">
      <div className={`bg-gradient-to-bl ${isGovt ? 'from-amber-500/10' : 'from-zinc-600/10'} to-transparent border-b border-zinc-800 p-3`}>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold mb-2 uppercase tracking-wider ${isGovt ? 'text-amber-400' : 'text-zinc-400'}`}>
          {isGovt ? <><Building2 size={11} /><span>جهة حكومية — غير مسجّل</span></> : <><Globe size={11} /><span>مرسل خارجي</span></>}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: ringColor }}>
            {getInitials(sender.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-zinc-100 leading-tight mb-0.5">{sender.name}</div>
            <div className="text-[10px] text-zinc-500 truncate" dir="ltr">{sender.email}</div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="bg-zinc-800/30 rounded-md p-2.5 text-[11px]">
          <code className="text-[10px] text-zinc-400">{domain}</code>
          {senderInfo?.org_name ? (
            <p className="mt-1.5 text-zinc-300 text-[10px]">الجهة: <span className="text-amber-300">{senderInfo.org_name}</span></p>
          ) : (
            <p className="mt-1.5 text-zinc-500 text-[10px]">غير مرتبط بأي ضابط اتصال أو مستفيد مسجّل.</p>
          )}
        </div>
      </div>
    </div>
  );
}
