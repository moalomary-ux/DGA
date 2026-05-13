'use client';

import React, { useEffect, useState } from 'react';

type Template = {
  id: number;
  code: string;
  name_ar: string;
  category: string;
  subject_template: string;
  body_template: string;
  variables: string[] | null;
};

type RenderedTemplate = {
  template_code: string;
  template_name: string;
  subject: string;
  body: string;
  context_used: Record<string, any>;
  unresolved: string[];
  requires_input: boolean;
};

export function TemplatesModal({
  inboundId,
  programId,
  onClose,
  onSelect,
}: {
  inboundId: number | null;
  programId: number | null;
  onClose: () => void;
  onSelect: (data: { subject: string; body: string; templateId: number }) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [rendered, setRendered] = useState<RenderedTemplate | null>(null);
  const [extraVars, setExtraVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/qtech/templates');
        const j = await r.json();
        setTemplates(j.templates || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderTemplate = async (template: Template, vars: Record<string, string> = {}) => {
    setRendering(true);
    try {
      const r = await fetch('/api/qtech/templates/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          inboundId,
          programId,
          extraVars: vars,
        }),
      });
      const j = await r.json();
      setRendered(j);
    } catch (e) {
      console.error(e);
    } finally {
      setRendering(false);
    }
  };

  const handleSelect = (t: Template) => {
    setSelected(t);
    setExtraVars({});
    renderTemplate(t);
  };

  const fillVar = (varName: string, value: string) => {
    const newVars = { ...extraVars, [varName]: value };
    setExtraVars(newVars);
    if (selected) renderTemplate(selected, newVars);
  };

  const useTemplate = () => {
    if (rendered && selected) {
      onSelect({
        subject: rendered.subject,
        body: rendered.body,
        templateId: selected.id,
      });
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 110,
        direction: 'rtl',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          width: 920,
          maxWidth: '95vw',
          height: 600,
          maxHeight: '85vh',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          border: '1px solid var(--line)',
          fontFamily: '"IBM Plex Sans Arabic", "Cairo", "Inter", system-ui',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* LEFT: templates list */}
        <aside style={{
          background: 'var(--surface-2)',
          borderInlineStart: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>📝 قوالب الردود</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>اختر قالباً للبدء</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
            {loading && (
              <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>
                جاري التحميل...
              </div>
            )}

            {!loading && templates.length === 0 && (
              <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>
                لا توجد قوالب
              </div>
            )}

            {!loading && templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'start',
                  padding: '10px 12px',
                  marginBottom: 4,
                  background: selected?.id === t.id ? 'var(--surface)' : 'transparent',
                  border: selected?.id === t.id ? '1px solid var(--w-accent, var(--accent, #10b981))' : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'var(--surface)'; }}
                onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  {iconForCategory(t.category)} {t.name_ar}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                  {t.code}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT: preview + vars */}
        <section style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {selected ? selected.name_ar : 'معاينة القالب'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                {selected ? 'سيُحقَن السياق تلقائياً من المحادثة' : 'اختر قالباً من اليسار'}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              fontSize: 18,
              cursor: 'pointer',
              width: 32, height: 32,
              borderRadius: 6,
            }}>✕</button>
          </div>

          {!selected ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              fontSize: 13,
              flexDirection: 'column',
              gap: 8,
            }}>
              <span style={{ fontSize: 48, opacity: 0.3 }}>📝</span>
              <span>اختر قالباً من القائمة</span>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Unresolved vars (input) */}
              {rendered && rendered.unresolved.length > 0 && (
                <div style={{
                  padding: 14,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>
                    ⚠ متغيرات تحتاج تعبئة:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {rendered.unresolved.map(v => {
                      const key = v.replace(/[{}]/g, '').trim();
                      return (
                        <div key={v}>
                          <label style={{ fontSize: 10, color: 'var(--text-3)', display: 'block', marginBottom: 3 }}>
                            {key}
                          </label>
                          <input
                            type="text"
                            placeholder={key}
                            value={extraVars[key] || ''}
                            onChange={e => fillVar(key, e.target.value)}
                            style={{
                              width: '100%',
                              background: 'var(--surface-2)',
                              border: '1px solid var(--line)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              color: 'var(--text)',
                              fontSize: 12,
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resolved context shown */}
              {rendered && Object.keys(rendered.context_used || {}).length > 0 && (
                <details style={{
                  padding: 10,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: 'var(--text-2)',
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#60a5fa' }}>
                    💡 السياق المُلتقَط من المحادثة ({Object.keys(rendered.context_used).length})
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    {Object.entries(rendered.context_used).map(([k, v]) => v && (
                      <div key={k} style={{ display: 'flex', gap: 8 }}>
                        <code style={{ color: 'var(--text-3)' }}>{k}:</code>
                        <span>{String(v).slice(0, 80)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Preview */}
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}>الموضوع</div>
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                }}>
                  {rendering ? '...' : rendered?.subject || '...'}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}>المحتوى</div>
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--surface-2)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-2)',
                  lineHeight: 1.8,
                  border: '1px solid var(--line)',
                  minHeight: 200,
                  whiteSpace: 'pre-wrap',
                  flex: 1,
                  overflowY: 'auto',
                }}>
                  {rendering ? '...' : rendered?.body || '...'}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {selected && (
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--line)',
              background: 'var(--surface-2)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <button
                onClick={useTemplate}
                disabled={!rendered}
                style={{
                  background: rendered ? 'var(--w-accent, var(--accent, #10b981))' : 'var(--surface)',
                  color: rendered ? '#fff' : 'var(--text-3)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: rendered ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                ✓ استخدم هذا القالب
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={{
                background: 'transparent',
                color: 'var(--text-3)',
                border: 'none',
                padding: '10px 16px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>إلغاء</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function iconForCategory(c: string): string {
  const map: Record<string, string> = {
    acceptance: '✅',
    rejection: '❌',
    waitlist: '⏳',
    request: '📋',
    reminder: '🔔',
  };
  return map[c] || '📄';
}
