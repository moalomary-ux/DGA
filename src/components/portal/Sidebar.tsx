'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut, ChevronsLeft,
  LayoutDashboard, Briefcase, User, Sparkles, Bot, Users,
  CheckSquare, Settings, Shield, GraduationCap, Award,
  Handshake, FileText, Building2, BookOpen, NotebookPen,
  Lightbulb, Target, Library, Calendar, Layers, Inbox, Cog, Database, Mail, MessageCircle, Plug, FolderOpen, Activity, Zap,
  type LucideIcon,
} from 'lucide-react';
import type { NavGroup, IconName } from '@/lib/nav';

const ICON_MAP: Record<IconName, LucideIcon> = {
  LayoutDashboard, Briefcase, User, Sparkles, Bot, Users,
  CheckSquare, Settings, Shield, GraduationCap, Award,
  Handshake, FileText, Building2, BookOpen, NotebookPen,
  Lightbulb, Target, Library, Calendar, Layers, Inbox, Cog, Database, Mail, MessageCircle, Plug, FolderOpen, Activity, Zap,
};

interface SidebarProps {
  tenantNameAr: string;
  tenantId: string;
  isMaster: boolean;
  userName: string;
  userEmail: string;
  navGroups: NavGroup[];
}

const PANEL_CSS = `
  /* Default (DARK theme): dark gradient */
  .qd-brand-panel {
    background: transparent;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .qd-brand-panel .qd-glow-1 { background: radial-gradient(circle, rgba(0,171,175,0.20), transparent 70%); }
  .qd-brand-panel .qd-glow-2 { background: radial-gradient(circle, rgba(124,50,201,0.18), transparent 70%); }

  /* LIGHT theme: soft pearl/teal gradient + dark logo */
  [data-theme="light"] .qd-brand-panel {
    background: linear-gradient(135deg, #F4F8FB 0%, #E8F0F8 45%, #DCE7F3 100%);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  [data-theme="light"] .qd-brand-panel .qd-glow-1 { background: radial-gradient(circle, rgba(0,171,175,0.18), transparent 70%); }
  [data-theme="light"] .qd-brand-panel .qd-glow-2 { background: radial-gradient(circle, rgba(124,50,201,0.16), transparent 70%); }

  /* NAVY theme: lavender/navy soft gradient */
  [data-theme="navy"] .qd-brand-panel {
    background: linear-gradient(135deg, #ECE9F5 0%, #DED7EA 50%, #C9BFDC 100%);
    border-bottom: 1px solid rgba(80,60,140,0.12);
  }
  [data-theme="navy"] .qd-brand-panel .qd-glow-1 { background: radial-gradient(circle, rgba(0,171,175,0.22), transparent 70%); }
  [data-theme="navy"] .qd-brand-panel .qd-glow-2 { background: radial-gradient(circle, rgba(124,50,201,0.24), transparent 70%); }

  /* Logo swap */
  .qd-logo-light { display: block; }
  .qd-logo-dark { display: none; }
  [data-theme="light"] .qd-logo-light,
  [data-theme="navy"] .qd-logo-light { display: none; }
  [data-theme="light"] .qd-logo-dark,
  [data-theme="navy"] .qd-logo-dark { display: block; }

  /* TMS Badge — adapts to theme */
  .qd-tms-badge {
    background: var(--bg-2);
    border: 1px solid var(--line);
    color: var(--text-3);
  }
`;

export function Sidebar({ tenantNameAr, tenantId, isMaster, userName, userEmail, navGroups }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const isQtech = tenantId === 'qtech';

  return (
    <>
      {isQtech && <style dangerouslySetInnerHTML={{ __html: PANEL_CSS }} />}

      <aside data-tenant-sidebar={tenantId} style={{
        width: collapsed ? 76 : 260,
        background: isQtech
          ? 'var(--surface)'
          : 'linear-gradient(180deg, var(--primary-3) 0%, var(--primary) 100%)',
        color: isQtech ? 'var(--text)' : 'rgba(255,255,255,0.85)',
        borderInlineStart: isQtech ? '1px solid var(--line)' : 'none',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 240ms var(--ease)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {!isQtech && (
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 4, height: '100%',
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%)',
            zIndex: 1,
          }} />
        )}

        {/* Branded panel */}
        <div className={isQtech ? 'qd-brand-panel' : ''} style={{
          padding: collapsed ? '20px 8px' : '22px 18px',
          background: !isQtech ? 'linear-gradient(135deg, #0E0828 0%, #1B1455 45%, #2A1F6B 100%)' : undefined,
          borderBottom: !isQtech ? '1px solid rgba(255,255,255,0.08)' : undefined,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 88,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <div className="qd-glow-1" style={{
            position: 'absolute', top: -30, insetInlineStart: -30,
            width: 140, height: 140,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
          <div className="qd-glow-2" style={{
            position: 'absolute', bottom: -30, insetInlineEnd: -30,
            width: 120, height: 120,
            filter: 'blur(28px)',
            pointerEvents: 'none',
          }} />

          <Link href="/dashboard" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {collapsed ? (
              <img src="/logo-qudratok-icon.png" alt="قدراتك"
                style={{ width: 44, height: 44, objectFit: 'contain', display: 'block',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
            ) : (
              <>
                <img src="/logo-qudratok.png" alt={tenantNameAr} className="qd-logo-light"
                  style={{ height: 50, width: 'auto', maxWidth: '100%',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
                <img src="/logo-qudratok-dark.png" alt={tenantNameAr} className="qd-logo-dark"
                  style={{ height: 50, width: 'auto', maxWidth: '100%',
                    filter: 'drop-shadow(0 2px 6px rgba(80,60,140,0.18))' }} />
              </>
            )}
          </Link>
        </div>

        {!collapsed && (
          <div style={{
            padding: '8px 18px',
            background: isQtech ? 'var(--surface)' : 'transparent',
            borderBottom: isQtech ? '1px solid var(--line)' : '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
            position: 'relative', zIndex: 1,
          }}>
            <div className={isQtech ? 'qd-tms-badge' : ''} style={{
              display: 'inline-block',
              padding: '3px 10px',
              background: !isQtech ? 'rgba(255,255,255,0.08)' : undefined,
              border: !isQtech ? '1px solid rgba(255,255,255,0.12)' : undefined,
              borderRadius: 999,
              fontSize: 9,
              color: !isQtech ? 'rgba(255,255,255,0.7)' : undefined,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}>
              {isMaster ? 'البوابة الأم' : 'INTERNAL TMS'}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, overflowY: 'auto', padding: '18px 12px', position: 'relative', zIndex: 1 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 9, color: isQtech ? 'var(--text-4)' : 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  padding: '8px 11px 4px', fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                }}>
                  {group.label}
                </div>
              )}
              <ul style={{ listStyle: 'none' }}>
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} style={{
                        display: 'flex', alignItems: 'center', gap: 11,
                        padding: '10px 11px', margin: '2px 0', borderRadius: 8,
                        color: isQtech
                          ? (active ? 'var(--primary)' : 'var(--text-2)')
                          : (active ? '#fff' : 'rgba(255,255,255,0.72)'),
                        background: isQtech
                          ? (active ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent')
                          : (active ? 'linear-gradient(90deg, var(--accent-bg) 0%, transparent 100%)' : 'transparent'),
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        transition: 'all 180ms var(--ease)',
                        borderInlineEnd: isQtech ? 'none'
                          : (active ? '2px solid var(--accent-2)' : '2px solid transparent'),
                      }}>
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.6}
                          style={{ color: active ? 'var(--accent-2)' : 'inherit' }} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.10)', position: 'relative', zIndex: 1 }}>
          {!collapsed && (
            <div style={{
              padding: '8px', background: isQtech ? 'transparent' : 'rgba(255,255,255,0.05)',
              borderRadius: 8, marginBottom: 8,
              border: isQtech ? '0' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: 11,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>
                {userName?.charAt(0) || 'م'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isQtech ? 'var(--text)' : '#fff',
                  fontFamily: 'var(--font-display)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{userName}</div>
                <div style={{
                  fontSize: 10,
                  color: isQtech ? 'var(--text-3)' : 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginTop: 1, fontFamily: 'var(--font-mono)',
                }}>{userEmail}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={logout} className="btn btn-ghost"
              style={{ flex: 1, justifyContent: collapsed ? 'center' : 'flex-start',
                       color: isQtech ? 'var(--text-3)' : 'rgba(255,255,255,0.7)',
                       padding: '10px 12px' }}>
              <LogOut size={16} />
              {!collapsed && <span style={{ fontSize: 13 }}>تسجيل الخروج</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost"
              style={{ padding: 8, color: isQtech ? 'var(--text-4)' : 'rgba(255,255,255,0.5)' }}>
              <ChevronsLeft size={16}
                style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 240ms' }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
