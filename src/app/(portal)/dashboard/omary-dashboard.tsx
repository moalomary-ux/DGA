import { db } from '@/lib/db';
import { headers } from 'next/headers';
import {
  Users, FileText, CheckSquare, Sparkles, Activity, ArrowLeft,
  Briefcase, Bot, BookOpen, ShieldCheck, KeyRound,
} from 'lucide-react';
import Link from 'next/link';

const eventLabels: Record<string, string> = {
  login_success: 'دخول ناجح',
  otp_requested: 'طلب رمز دخول',
  otp_failed: 'محاولة دخول فاشلة',
  registration_pending: 'طلب تسجيل جديد',
  registration_approved: 'الموافقة على تسجيل',
};
const eventIcons: Record<string, { icon: typeof Activity; variant: string }> = {
  login_success: { icon: ShieldCheck, variant: 'activity-icon-success' },
  otp_requested: { icon: KeyRound, variant: 'activity-icon-info' },
  registration_pending: { icon: Users, variant: 'activity-icon-info' },
  registration_approved: { icon: ShieldCheck, variant: 'activity-icon-success' },
};

interface Props {
  session: { nameAr?: string; email?: string };
  tenant: { id: string; description: string };
}

export async function OmaryDashboard({ session, tenant }: Props) {
  const h = await headers();
  const host = h.get('host') || 'localhost';
  const isLocal = host.includes('localhost') || host.includes('.local');
  const protocol = isLocal ? 'http' : 'https';
  const port = isLocal ? `:${host.split(':')[1] || '3000'}` : '';
  const qtechUrl  = isLocal ? `${protocol}://qtech.local${port}`  : 'https://qtech.help';
  const adviceUrl = isLocal ? `${protocol}://advice.local${port}` : 'https://advicedga.cloud';

  const [users, contacts, pendingRegs, codes, programs, studies] = await Promise.all([
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM users WHERE is_active = true`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM ecosystem_contacts`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM registration_requests WHERE status = 'pending'`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM auth_codes WHERE created_at > NOW() - INTERVAL '24 hours'`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM ecosystem_programs WHERE status IN ('open','running')`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM studies WHERE status IN ('in_progress','review')`,
  ]);

  const stats = [
    { label: 'مستخدمون نشطون', value: users[0].count, color: 'var(--dga-navy)', bg: 'rgba(42,32,106,0.10)', icon: Users },
    { label: 'برامج قدراتك',   value: programs[0].count, color: 'var(--dga-green)', bg: 'rgba(28,193,130,0.10)', icon: Sparkles },
    { label: 'دراسات الاستشارات', value: studies[0].count, color: 'var(--dga-purple)', bg: 'rgba(124,50,201,0.10)', icon: FileText },
    { label: 'طلبات معلّقة',  value: pendingRegs[0].count, color: 'var(--warning)', bg: 'var(--warning-bg)', icon: CheckSquare },
  ];

  const recentEvents = await db<{ event: string; created_at: Date }[]>`
    SELECT event, created_at FROM audit_log ORDER BY created_at DESC LIMIT 6
  `;

  const today = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div>
      <div className="hero" style={{ marginBottom: 32 }}>
        <div className="hero-eyebrow">{today}</div>
        <h1 className="hero-title">مرحباً، {session.nameAr?.split(' ')[0]}</h1>
        <p className="hero-subtitle">{tenant.description}</p>
        <div className="hero-meta">
          <div className="hero-meta-item">البوابة<strong>الأم</strong></div>
          <div className="hero-meta-item">الدور<strong>super_admin</strong></div>
          <div className="hero-meta-item">البريد<strong style={{ fontSize: 13 }}>{session.email}</strong></div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card" style={{ ['--stat-color' as string]: stat.color, ['--stat-bg' as string]: stat.bg } as React.CSSProperties}>
              <div className="stat-card-icon"><Icon size={20} strokeWidth={1.8} /></div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <div className="section-title"><span className="section-title-bar" /> البوابات الفرعية</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <a href={qtechUrl} className="card" style={{
          padding: 28, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #1cc18215 0%, #1cc18205 100%)',
          borderColor: 'rgba(28,193,130,0.2)',
          textDecoration: 'none',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 16,
            background: 'var(--dga-green)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)',
          }}>ق</div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>قدراتك — المهارات الرقمية</h3>
          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            إدارة برامج التدريب والمتدربين والشركاء
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--dga-green)', fontWeight: 600 }}>
            دخول البوابة <ArrowLeft size={14} />
          </div>
        </a>

        <a href={adviceUrl} className="card" style={{
          padding: 28, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #7c32c915 0%, #7c32c905 100%)',
          borderColor: 'rgba(124,50,201,0.2)',
          textDecoration: 'none',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 16,
            background: 'var(--dga-purple)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)',
          }}>إ</div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>الاستشارات والدراسات</h3>
          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            إدارة الدراسات والاستشارات للجهات الحكومية
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--dga-purple)', fontWeight: 600 }}>
            دخول البوابة <ArrowLeft size={14} />
          </div>
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20 }}>
        <div className="card-bordered">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={18} style={{ color: 'var(--text-3)' }} />
              <span className="card-title">آخر الأنشطة</span>
            </div>
            <span className="badge badge-neutral">{recentEvents.length} حدث</span>
          </div>
          <div className="activity-list">
            {recentEvents.map((event, idx) => {
              const conf = eventIcons[event.event] || { icon: Activity, variant: '' };
              const Icon = conf.icon;
              return (
                <div key={idx} className="activity-row">
                  <div className={`activity-icon ${conf.variant}`}><Icon size={16} /></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>
                      {eventLabels[event.event] || event.event}
                    </div>
                    <code style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{event.event}</code>
                  </div>
                  <div className="activity-time">
                    {new Date(event.created_at).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-bordered">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={18} style={{ color: 'var(--text-3)' }} />
              <span className="card-title">حالة النظام</span>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {[
              { label: 'قاعدة البيانات', value: 'متصلة', tone: 'success' },
              { label: 'Hermes Bridge',   value: 'غير متصل', tone: 'warning' },
              { label: 'WireGuard',       value: 'غير متصل', tone: 'warning' },
              { label: 'الإيميل (SMTP)', value: 'غير مفعّل', tone: 'neutral' },
            ].map((row) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--line-soft)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.label}</span>
                <span className={`badge badge-${row.tone}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
