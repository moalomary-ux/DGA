'use client';

import { useState, useEffect, useCallback } from 'react';
import InboxView from './InboxView';
import ComposerModal from './ComposerModal';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

function deriveInitials(name: string): string {
  if (!name) return 'QT';
  const clean = name.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.substring(0, 2).toUpperCase();
}

function extractEmail(addr: string): string {
  if (!addr) return '';
  const m = addr.match(/<([^>]+)>/);
  return m ? m[1].trim() : addr.trim();
}

export function CommunicationView() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; initials: string }>({
    name: '',
    initials: 'MA',
  });

  const loadInbox = useCallback(async () => {
    try {
      const r = await fetch('/api/qtech/inbox?limit=300', { cache: 'no-store' });
      const d = await r.json();
      const visible = (d.messages || []).filter((m: any) => m.status !== 'archived');
      setMessages(visible);
    } catch (e) {
      console.error('load inbox failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          const name = d.user.name_ar || d.user.name_en || '';
          setCurrentUser({ name, initials: deriveInitials(name) });
        }
      })
      .catch(() => {});
  }, [loadInbox]);

  const handleCompose = () => {
    setReplyContext(null);
    setComposerOpen(true);
  };

  const handleReply = (msg: any) => {
    setReplyContext({
      to: extractEmail(msg.from_addr),
      subject: msg.subject?.startsWith('RE:') ? msg.subject : 'RE: ' + (msg.subject || ''),
      inReplyTo: msg.id,
      liaisonName: msg.liaison_name || undefined,
    });
    setComposerOpen(true);
  };

  const handleSent = () => {
    setComposerOpen(false);
    loadInbox();
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="animate-spin text-teal-500 mx-auto mb-3" size={32} />
          <div className="text-zinc-400 text-sm">جارٍ تحميل صندوق الوارد...</div>
        </div>
      </div>
    );
  }

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => m.status === 'new').length,
    flagged: messages.filter((m) => m.status === 'flagged').length,
    replied: messages.filter((m) => m.status === 'replied').length,
  };

  return (
    <div className="px-4 py-3" dir="rtl">
      {/* Header — compact */}
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 mb-0.5 flex items-center gap-2">
            <Mail size={18} className="text-teal-400" />
            مركز التواصل
          </h1>
          <p className="text-[11px] text-zinc-500">
            q-tech@dga.gov.sa · يتزامن تلقائياً مع Apple Mail على Mac mini · 298 ضابط اتصال
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="text-center">
            <div className="text-base font-bold text-zinc-200">{stats.total}</div>
            <div className="text-zinc-500">إجمالي</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-blue-300">{stats.unread}</div>
            <div className="text-zinc-500">جديد</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-yellow-300">{stats.flagged}</div>
            <div className="text-zinc-500">مهم</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-emerald-300">{stats.replied}</div>
            <div className="text-zinc-500">رُد</div>
          </div>
        </div>
      </div>

      <InboxView
        initialMessages={messages}
        onCompose={handleCompose}
        onReply={handleReply}
      />

      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        initial={replyContext}
        currentUser={currentUser}
        onSent={handleSent}
      />
    </div>
  );
}
