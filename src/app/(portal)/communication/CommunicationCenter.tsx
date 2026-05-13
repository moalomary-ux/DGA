'use client';

import { useState } from 'react';
import { Mail, FileText, Send, Inbox, Plus, Download } from 'lucide-react';
import { Pill } from '@/components/qtech/Pill';

interface Template {
  id: number; template_code: string; name_ar: string;
  category: string; subject: string; body_html: string;
  body_plain: string | null; variables: string[] | null;
  is_active: boolean;
}

interface Queue {
  id: number; subject: string; to_email: string; to_name: string | null;
  status: string; created_at: string;
}

interface Program {
  id: number; code: string; name_ar: string;
}

const CAT_AR: Record<string, string> = {
  acceptance: 'القبول',
  rejection: 'الاعتذار',
  waitlist: 'قائمة الانتظار',
  file_request: 'طلب ملفات',
  reminder: 'تذكير',
  welcome: 'ترحيب',
  certificate: 'شهادة',
  followup: 'متابعة',
  other: 'أخرى',
};

const CAT_COLORS: Record<string, string> = {
  acceptance: 'var(--success)',
  rejection: 'var(--danger)',
  waitlist: 'var(--warning)',
  file_request: 'var(--accent-2)',
  reminder: 'var(--primary)',
};

export function CommunicationCenter({ templates, queue, programs }: {
  templates: Template[];
  queue: Queue[];
  programs: Program[];
}) {
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4, fontWeight: 700 }}>مركز التواصل</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
          قوالب الإيميلات الجاهزة — توليد ملفات .eml للإرسال من Outlook بعد المراجعة
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* Templates list */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: 14, height: 'fit-content', position: 'sticky', top: 80,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>القوالب</h3>
            <button style={{
              padding: 6, background: 'var(--primary-bg)', color: 'var(--primary)',
              borderRadius: 6, border: 0, cursor: 'pointer',
            }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {templates.map((t) => (
              <button key={t.id} onClick={() => setSelectedTpl(t)}
                style={{
                  textAlign: 'start', padding: 10,
                  background: selectedTpl?.id === t.id ? 'var(--primary-bg)' : 'var(--bg-2)',
                  border: `1px solid ${selectedTpl?.id === t.id ? 'var(--primary)' : 'var(--line)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.name_ar}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: CAT_COLORS[t.category] || 'var(--text-3)',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {t.template_code}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor + queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedTpl ? (
            <TemplateEditor template={selectedTpl} programs={programs} />
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: 60, textAlign: 'center',
            }}>
              <Mail size={48} style={{ color: 'var(--text-4)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-3)' }}>اختر قالباً للبدء</p>
            </div>
          )}

          {/* Queue */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Inbox size={16} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>قائمة الإيميلات الجاهزة للإرسال</h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{queue.length}</span>
            </div>
            {queue.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                لم تُولّد أي إيميلات بعد
              </div>
            ) : (
              <div>
                {queue.map((q) => (
                  <div key={q.id} style={{
                    padding: '12px 18px', borderBottom: '1px solid var(--line-soft)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <Mail size={14} style={{ color: 'var(--text-3)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{q.subject}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {q.to_name ? `${q.to_name} · ` : ''}{q.to_email}
                      </div>
                    </div>
                    <Pill tone={q.status === 'exported' ? 'success' : 'warning'}>
                      {q.status === 'exported' ? 'تم التصدير' : 'مسودّة'}
                    </Pill>
                    <button style={{
                      padding: '6px 10px', background: 'var(--primary)', color: '#fff',
                      borderRadius: 6, border: 0, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Download size={11} /> تحميل .eml
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ template, programs }: { template: Template; programs: Program[] }) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body_plain || template.body_html);
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [programId, setProgramId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!toEmail) { alert('أدخل الإيميل'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/communication/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          program_id: programId,
          to_email: toEmail,
          to_name: toName,
          subject,
          body_html: body,
        }),
      });
      const data = await res.json();
      if (data.eml_url) {
        // Download as file
        const blob = new Blob([data.eml_content], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.template_code}_${Date.now()}.eml`;
        a.click();
        URL.revokeObjectURL(url);
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 14, padding: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{template.name_ar}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {CAT_AR[template.category]} · <code style={{ fontFamily: 'var(--font-mono)' }}>{template.template_code}</code>
          </p>
        </div>
      </div>

      {template.variables && template.variables.length > 0 && (
        <div style={{
          marginBottom: 14, padding: 10, background: 'var(--primary-bg)',
          borderRadius: 8, fontSize: 11, color: 'var(--text-2)',
        }}>
          <b style={{ color: 'var(--primary)' }}>المتغيّرات:</b>{' '}
          {template.variables.map((v) => (
            <code key={v} style={{
              fontFamily: 'var(--font-mono)', padding: '1px 5px',
              background: 'var(--surface)', borderRadius: 3, marginInlineEnd: 4,
            }}>{`{{${v}}}`}</code>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Field label="إلى (الاسم)">
          <input value={toName} onChange={(e) => setToName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="إلى (الإيميل)">
          <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <Field label="البرنامج المرتبط (اختياري)">
        <select value={programId || ''} onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : null)} style={inputStyle}>
          <option value="">— لا يوجد —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.code} · {p.name_ar}</option>
          ))}
        </select>
      </Field>

      <Field label="الموضوع">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="المحتوى">
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          style={{ ...inputStyle, minHeight: 200, fontFamily: 'inherit', resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={generate} disabled={generating || !toEmail}
          style={{
            padding: '10px 18px', background: 'var(--grad-2)', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: 0, cursor: 'pointer', opacity: generating || !toEmail ? 0.5 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <Download size={14} />
          {generating ? 'جارٍ التوليد...' : 'توليد ملف .eml'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg-2)', border: '1px solid var(--line)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)',
  outline: 'none',
};
