import { headers } from 'next/headers';
import { detectTenant } from '@/lib/tenant';
import { getSession } from '@/lib/auth';
import { Cog, Palette, Globe, Mail, Bell, Shield } from 'lucide-react';
import { ThemeSwitcher } from '@/components/qtech/ThemeSwitcher';
import { ThemeProvider, type Theme } from '@/components/qtech/ThemeProvider';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');
  const session = await getSession();

  let theme: Theme = 'dark';
  try {
    const rows = await db<{ theme: string }[]>`
      SELECT theme FROM user_preferences WHERE user_id = ${session.userId}
    `;
    if (rows.length && ['dark','light','navy'].includes(rows[0].theme)) {
      theme = rows[0].theme as Theme;
    }
  } catch {}

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4, fontWeight: 700 }}>الإعدادات</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>تخصيص تجربتك في {tenant.nameAr}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
        {/* المظهر */}
        {tenant.id === 'qtech' && (
          <ThemeProvider initialTheme={theme}>
            <SettingCard
              icon={<Palette size={18} />}
              title="المظهر"
              desc="اختر الوضع البصري المفضّل لك"
            >
              <ThemeSwitcher />
            </SettingCard>
          </ThemeProvider>
        )}

        {/* الحساب */}
        <SettingCard
          icon={<Shield size={18} />}
          title="الحساب"
          desc="معلومات حسابك وحالة الجلسة"
        >
          <Row label="الاسم" value={session.nameAr || '—'} />
          <Row label="البريد" value={session.email || '—'} mono />
          <Row label="البوابة" value={tenant.nameAr} />
        </SettingCard>

        {/* الإشعارات */}
        <SettingCard
          icon={<Bell size={18} />}
          title="الإشعارات"
          desc="تحكّم في الإشعارات التي تصلك"
        >
          <Toggle label="إشعارات الترشيحات الجديدة" defaultOn />
          <Toggle label="تذكير البرامج اليومي" defaultOn />
          <Toggle label="تنبيهات الذكاء الاصطناعي" />
        </SettingCard>

        {/* الإيميل */}
        <SettingCard
          icon={<Mail size={18} />}
          title="قوالب الإيميلات"
          desc="إدارة قوالب البريد الإلكتروني التلقائية"
          comingSoon
        />

        {/* اللغة */}
        <SettingCard
          icon={<Globe size={18} />}
          title="اللغة والمنطقة"
          desc="اللغة الافتراضية وإعدادات التاريخ"
          comingSoon
        />
      </div>
    </div>
  );
}

function SettingCard({
  icon, title, desc, children, comingSoon,
}: {
  icon: React.ReactNode; title: string; desc: string;
  children?: React.ReactNode; comingSoon?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: children ? 16 : 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--primary-bg)', color: 'var(--primary)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
            {comingSoon && (
              <span style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99,
                background: 'var(--bg-2)', color: 'var(--text-3)',
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>قريباً</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--line-soft)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--text)', fontWeight: 500,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>{value}</span>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--line-soft)', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} style={{
        width: 36, height: 20, cursor: 'pointer',
      }} />
    </label>
  );
}
