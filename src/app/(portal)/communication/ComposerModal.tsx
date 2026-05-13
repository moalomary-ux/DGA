'use client';

import { useState, useEffect } from 'react';
import { X, Send, Save, FileText, AlertCircle, Sparkles, Image as ImageIcon, Bot, Loader2, RefreshCw } from 'lucide-react';

interface ComposerProps {
  open: boolean;
  onClose: () => void;
  initial?: {
    to?: string;
    subject?: string;
    body?: string;
    body_html?: string;
    inReplyTo?: number | null;
    liaisonName?: string;
  };
  currentUser?: { name?: string; initials?: string };
  onSent?: () => void;
}

const FROM_IDENTITY = 'برنامج قدراتك | هيئة الحكومة الرقمية';
const FROM_EMAIL = 'q-tech@dga.gov.sa';
const DEFAULT_BCC = 'skills@qtech.help';

function deriveInitials(name?: string): string {
  if (!name) return 'QT';
  const clean = name.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.substring(0, 2).toUpperCase();
}

export default function ComposerModal({ open, onClose, initial, currentUser, onSent }: ComposerProps) {
  const [to, setTo] = useState(initial?.to || '');
  const [bcc, setBcc] = useState(DEFAULT_BCC);
  const [subject, setSubject] = useState(initial?.subject || '');
  const [body, setBody] = useState(initial?.body || '');
  const [bodyHtml, setBodyHtml] = useState(initial?.body_html || '');
  const [useHtml, setUseHtml] = useState(false);
  const [initials, setInitials] = useState(deriveInitials(currentUser?.name));
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState(false);

  // AI Suggest state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTo(initial?.to || '');
    setBcc(DEFAULT_BCC);
    setSubject(initial?.subject || '');
    setBody(initial?.body || '');
    setBodyHtml(initial?.body_html || '');
    setUseHtml(!!initial?.body_html);
    setInitials(deriveInitials(currentUser?.name));
    setError(null);
    setSavedDraft(false);
    setAiOpen(false);
    setAiSuggestions([]);
  }, [open, initial, currentUser]);

  useEffect(() => {
    if (!open) return;
    setTemplatesLoading(true);
    fetch('/api/qtech/templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.templates)) setTemplates(data.templates);
      })
      .finally(() => setTemplatesLoading(false));
  }, [open]);

  const applyTemplate = async (templateId: number) => {
    try {
      const r = await fetch('/api/qtech/templates/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templateId,
          inboundId: initial?.inReplyTo,
          extraVars: initial?.liaisonName ? { trainee_name: initial.liaisonName } : {},
        }),
      });
      const data = await r.json();
      if (data.subject) setSubject(data.subject);
      if (data.body_html) {
        setBodyHtml(data.body_html);
        setUseHtml(true);
      }
      if (data.body) setBody(data.body);
      setShowTemplates(false);
    } catch (e) {
      setError('فشل تحميل القالب');
    }
  };

  const requestAiSuggestions = async () => {
    if (!initial?.inReplyTo) {
      setAiError('الاقتراحات الذكية متاحة فقط عند الرد على إيميل وارد');
      setAiOpen(true);
      return;
    }
    setAiLoading(true);
    setAiOpen(true);
    setAiError(null);
    setAiSuggestions([]);
    try {
      const r = await fetch('/api/qtech/ai/suggest-reply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inboundId: initial.inReplyTo }),
      });
      const data = await r.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiError(data.detail || data.error || 'لا توجد اقتراحات');
      }
    } catch (e: any) {
      setAiError(e.message || 'فشل الاتصال بالذكاء');
    } finally {
      setAiLoading(false);
    }
  };

  const useAiSuggestion = (sug: any) => {
    setSubject(sug.subject || subject);
    setBody(sug.body || '');
    setUseHtml(false);
    setAiOpen(false);
  };

  const send = async () => {
    if (!to.trim() || !subject.trim() || (!body.trim() && !bodyHtml.trim())) {
      setError('يجب تعبئة المستلم والموضوع والمحتوى');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const r = await fetch('/api/qtech/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          bcc: bcc.trim() || null,
          subject: subject.trim(),
          body: useHtml ? appendSignature(bodyHtml, initials, true) : appendSignature(body, initials, false),
          body_html: useHtml,
          in_reply_to: initial?.inReplyTo,
          initials,
        }),
      });
      const data = await r.json();
      if (!r.ok || data.error) {
        setError(data.detail || data.error || 'فشل الإرسال');
        return;
      }
      onSent?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'خطأ في الشبكة');
    } finally {
      setSending(false);
    }
  };

  const saveDraft = async () => {
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-l from-teal-500/10 to-zinc-900 px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <Send size={16} className="text-teal-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                {initial?.inReplyTo ? 'الرد على إيميل' : 'إنشاء إيميل جديد'}
              </h2>
              <p className="text-[10px] text-zinc-500">من حساب q-tech@dga.gov.sa</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* From identity */}
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-teal-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-zinc-500 mb-0.5">من:</div>
              <div className="text-sm font-bold text-teal-200 truncate">{FROM_IDENTITY}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">&lt;{FROM_EMAIL}&gt;</div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-bold mb-1 block">إلى</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="example@gov.sa"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>BCC للأرشيف:</span>
            <input
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
            />
            <span>•</span>
            <span>الحرفان:</span>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().substring(0, 3))}
              maxLength={3}
              className="w-12 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-center text-zinc-200 font-bold focus:outline-none focus:border-teal-500/50"
              title="مثل OJ — يظهر في توقيع الإيميل"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-bold mb-1 block">الموضوع</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 border border-teal-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText size={12} />
              <span>{showTemplates ? 'إخفاء القوالب' : `${templates.length} قالب جاهز`}</span>
            </button>

            {initial?.inReplyTo && (
              <button
                onClick={requestAiSuggestions}
                disabled={aiLoading}
                className="bg-gradient-to-l from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                <span>{aiLoading ? 'يُحلّل...' : '✨ اقتراح رد بالذكاء'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mr-auto">
              <input
                type="checkbox"
                checked={useHtml}
                onChange={(e) => setUseHtml(e.target.checked)}
                id="html-toggle"
                className="accent-teal-500"
              />
              <label htmlFor="html-toggle">HTML rich</label>
            </div>
          </div>

          {/* Templates dropdown */}
          {showTemplates && (
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2 space-y-1">
              {templatesLoading ? (
                <div className="text-center py-3 text-xs text-zinc-500">جارٍ التحميل...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-3 text-xs text-zinc-500">لا توجد قوالب</div>
              ) : (
                templates.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    className="w-full text-right p-2 hover:bg-zinc-800/50 rounded text-xs flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="text-zinc-200 font-bold">{t.name_ar}</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5 truncate">{t.subject_template?.substring(0, 70)}</div>
                    </div>
                    <code className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap">{t.code}</code>
                  </button>
                ))
              )}
            </div>
          )}

          {/* AI Suggestions */}
          {aiOpen && (
            <div className="bg-gradient-to-bl from-purple-500/10 to-zinc-950 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
                  <Bot size={12} /> اقتراحات الذكاء الاصطناعي
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={requestAiSuggestions} className="text-purple-300 hover:text-purple-100 p-1" title="إعادة">
                    <RefreshCw size={11} />
                  </button>
                  <button onClick={() => setAiOpen(false)} className="text-zinc-500 hover:text-zinc-200 p-1">
                    <X size={12} />
                  </button>
                </div>
              </div>
              {aiLoading ? (
                <div className="text-center py-6">
                  <Loader2 size={20} className="animate-spin text-purple-400 mx-auto mb-2" />
                  <div className="text-[11px] text-purple-300">يُحلّل الإيميل ويقترح ردوداً...</div>
                </div>
              ) : aiError ? (
                <div className="text-[11px] text-amber-300 py-2">⚠ {aiError}</div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {aiSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => useAiSuggestion(s)}
                      className="w-full text-right bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 rounded-md p-2.5 transition"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">{s.label}</span>
                      </div>
                      {s.subject && <div className="text-[12px] text-zinc-200 font-bold mb-1 truncate">{s.subject}</div>}
                      <div className="text-[11px] text-zinc-400 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {s.body?.substring(0, 200)}{(s.body?.length || 0) > 200 ? '...' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-[11px] text-zinc-500">لا توجد اقتراحات</div>
              )}
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-[11px] text-zinc-400 font-bold mb-1 block">المحتوى</label>
            {useHtml ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>اكتب الرسالة بتنسيق HTML...</p>"
                  rows={10}
                  className="w-full bg-transparent px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none font-mono leading-relaxed"
                />
                {bodyHtml && (
                  <div className="border-t border-zinc-800 p-3 max-h-40 overflow-y-auto bg-white/5">
                    <div className="text-[10px] font-bold text-zinc-500 mb-2">معاينة:</div>
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-200" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="..."
                rows={11}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 leading-relaxed"
              />
            )}
          </div>

          {/* Signature */}
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-lg p-3 text-[11px] text-zinc-400">
            <div className="text-[10px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1">
              <ImageIcon size={10} /> <span>سيُضاف هذا التوقيع تلقائياً</span>
            </div>
            <div className="space-y-0.5 text-zinc-500">
              <div>--</div>
              <div>مع التحية،</div>
              <div className="font-bold text-teal-300">فريق برنامج قدراتك</div>
              <div>هيئة الحكومة الرقمية</div>
              <div className="text-zinc-600">[{initials}]</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-3 flex items-center justify-between gap-2">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 text-xs px-2">إلغاء</button>
          <div className="flex items-center gap-2">
            <button
              onClick={saveDraft}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Save size={12} />
              {savedDraft ? '✓ تم الحفظ' : 'حفظ كمسودة'}
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="bg-teal-500 hover:bg-teal-400 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Send size={12} />
              {sending ? 'جارٍ الإرسال...' : 'إرسال'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function appendSignature(body: string, initials: string, isHtml: boolean): string {
  if (isHtml) {
    if (body.includes('فريق برنامج قدراتك') || body.includes('فريق قدراتك')) return body;
    const sig = `<p style="margin-top:24px;border-top:1px solid #ddd;padding-top:12px;color:#666;font-size:13px;">
مع التحية،<br>
<b>فريق برنامج قدراتك</b><br>
هيئة الحكومة الرقمية<br>
<span style="color:#999;font-size:11px;">${initials}</span>
</p>`;
    return body + sig;
  } else {
    if (body.includes('فريق قدراتك') || body.includes('فريق برنامج قدراتك')) return body;
    return body + `\n\n--\nمع التحية،\nفريق برنامج قدراتك\nهيئة الحكومة الرقمية\n${initials}`;
  }
}
