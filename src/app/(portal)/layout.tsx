import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant';
import { Sidebar } from '@/components/portal/Sidebar';
import { buildNav } from '@/lib/nav';
import { Search, Bell } from 'lucide-react';
import { ThemeProvider, type Theme } from '@/components/qtech/ThemeProvider';
import { ThemeSwitcher } from '@/components/qtech/ThemeSwitcher';

export const dynamic = 'force-dynamic';

const AURORA_CSS = `
  @keyframes aurora-portal-shift {
    0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); }
    33% { transform: translate(6%, -4%) scale(1.12) rotate(35deg); }
    66% { transform: translate(-5%, 4%) scale(1.08) rotate(70deg); }
  }
  .aurora-portal { display: none; pointer-events: none; will-change: transform; }
  [data-theme="dark"] .aurora-portal,
  [data-theme="navy"] .aurora-portal { display: block; }
  .aurora-portal-1 {
    position: fixed; inset: -20%; z-index: 0;
    background: radial-gradient(circle at 22% 28%, rgba(124,50,201,0.16), transparent 55%);
    filter: blur(80px);
    animation: aurora-portal-shift 24s ease-in-out infinite;
  }
  .aurora-portal-2 {
    position: fixed; inset: -20%; z-index: 0;
    background: radial-gradient(circle at 78% 72%, rgba(0,171,175,0.13), transparent 55%);
    filter: blur(90px);
    animation: aurora-portal-shift 30s ease-in-out infinite reverse;
  }
  .aurora-portal-3 {
    position: fixed; inset: -20%; z-index: 0;
    background: radial-gradient(circle at 50% 100%, rgba(60,30,140,0.10), transparent 60%);
    filter: blur(60px);
    animation: aurora-portal-shift 36s ease-in-out infinite;
  }
`;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');

  if (!session.isLoggedIn || !session.userId) redirect('/login');
  const membership = session.memberships?.find((m) => m.tenant === tenant.id);
  if (!membership) redirect('/login?error=no_access');

  const navGroups = buildNav(
    tenant.id,
    tenant.isMaster,
    membership.role === 'super_admin',
  );

  let initialTheme: Theme = 'dark';
  try {
    const rows = await db<{ theme: string }[]>`
      SELECT theme FROM user_preferences WHERE user_id = ${session.userId}
    `;
    if (rows.length && ['dark','light','navy'].includes(rows[0].theme)) {
      initialTheme = rows[0].theme as Theme;
    }
  } catch {}

  const isQtech = tenant.id === 'qtech';

  const content = (
    <>
      <style dangerouslySetInnerHTML={{ __html: AURORA_CSS }} />
      <div className="aurora-portal aurora-portal-1" aria-hidden="true" />
      <div className="aurora-portal aurora-portal-2" aria-hidden="true" />
      <div className="aurora-portal aurora-portal-3" aria-hidden="true" />

      <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 1 }}>
        <Sidebar
          tenantNameAr={tenant.nameAr}
          tenantId={tenant.id}
          isMaster={tenant.isMaster}
          userName={session.nameAr || ''}
          userEmail={session.email || ''}
          navGroups={navGroups}
        />

        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <header style={{
            height: 64,
            background: isQtech
              ? 'color-mix(in srgb, var(--surface) 78%, transparent)'
              : 'rgba(255,255,255,0.85)',
            borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 26px',
            position: 'sticky', top: 0, zIndex: 10,
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, maxWidth: 420 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input placeholder="بحث سريع..." style={{
                  width: '100%', padding: '8px 38px 8px 14px',
                  background: 'var(--bg-2)', border: '1px solid var(--line)',
                  borderRadius: 8, fontSize: 13,
                  color: 'var(--text)', outline: 'none',
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isQtech && <ThemeSwitcher />}
              <button style={{
                padding: 8, position: 'relative',
                background: 'var(--bg-2)', border: '1px solid var(--line)',
                borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer',
                width: 36, height: 36, display: 'grid', placeItems: 'center',
              }}>
                <Bell size={16} />
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 6, height: 6, background: 'var(--danger)',
                  borderRadius: '50%',
                }} />
              </button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', background: 'var(--success-bg)',
                borderRadius: 999, fontSize: 12, color: 'var(--success)', fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                <span>متصل</span>
              </div>
            </div>
          </header>

          <div style={{ padding: '26px', maxWidth: 1500, margin: '0 auto', position: 'relative' }}>{children}</div>
        </main>
      </div>
    </>
  );

  if (isQtech) {
    return <ThemeProvider initialTheme={initialTheme}>{content}</ThemeProvider>;
  }
  return content;
}
