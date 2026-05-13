'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ activated: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: name,
          email,
          position: position || undefined,
          invite_code: inviteCode || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذّر إنشاء الحساب');
      setSuccess({ activated: data.activated === true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          {success.activated ? 'تم تفعيل حسابك' : 'تم استلام طلبك'}
        </h2>

        <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24 }}>
          {success.activated
            ? 'حسابك جاهز. تم إرسال رابط الدخول إلى بريدك الإلكتروني.'
            : 'سيُراجَع طلبك من المسؤول. ستصلك رسالة بريد إلكتروني عند تفعيل الحساب.'}
        </p>

        <a href="/login" className="btn btn-primary">
          العودة لتسجيل الدخول
          <ArrowLeft size={16} />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>إنشاء حساب جديد</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
        املأ النموذج، وستُراجع جهتك للموافقة
      </p>

      <div style={{ marginBottom: 14 }}>
        <label className="label" htmlFor="name">الاسم بالكامل *</label>
        <input
          id="name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="مثال: أحمد محمد"
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="label" htmlFor="email">البريد الإلكتروني *</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@dga.gov.sa"
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="label" htmlFor="position">المنصب</label>
        <input
          id="position"
          type="text"
          className="input"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="مثال: مدير إدارة..."
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="label" htmlFor="invite">رمز الدعوة (اختياري)</label>
        <input
          id="invite"
          type="text"
          className="input"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="DGA-XXXXXXXX"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="label" htmlFor="notes">ملاحظات (اختياري)</label>
        <textarea
          id="notes"
          className="textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="مثال: أحتاج وصول لمراجعة دراسات Q2"
        />
      </div>

      {error && (
        <div className="badge badge-danger" style={{ padding: '8px 14px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px' }}
        disabled={loading || !name || !email}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'إنشاء الحساب'}
        {!loading && <ArrowLeft size={16} />}
      </button>

      <div
        style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid var(--line)',
          fontSize: 13,
          color: 'var(--text-3)',
          textAlign: 'center',
        }}
      >
        لديك حساب؟{' '}
        <a href="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>
          تسجيل الدخول
        </a>
      </div>
    </form>
  );
}
