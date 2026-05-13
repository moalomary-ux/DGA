import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { detectTenant } from '@/lib/tenant';
import { Plug, RefreshCw, ArrowRightLeft, Check, X, AlertCircle, Settings } from 'lucide-react';
import { Pill } from '@/components/qtech/Pill';

export const dynamic = 'force-dynamic';

export default async function MondayIntegrationPage() {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');

  if (tenant.id !== 'qtech') {
    return (
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>تكامل monday.com</h1>
        <p style={{ color: 'var(--text-3)' }}>هذه الصفحة متاحة فقط في بوابة قدراتك.</p>
      </div>
    );
  }

  // قراءة config (حاول منها — لو الجدول ما موجود نستخدم defaults)
  let config: { workspace_id: string | null; sync_direction: string | null; api_token_set: boolean } = {
    workspace_id: null, sync_direction: 'bidirectional', api_token_set: false,
  };
  try {
    const c = await db<{ workspace_id: string | null; sync_direction: string | null; api_token: string | null }[]>`
      SELECT workspace_id, sync_direction, api_token FROM monday_configs WHERE tenant = 'qtech' LIMIT 1
    `;
    if (c.length > 0) {
      config = {
        workspace_id: c[0].workspace_id,
        sync_direction: c[0].sync_direction,
        api_token_set: !!c[0].api_token,
      };
    }
  } catch {}

  // mappings
  const mappings = await db<{
    id: number; program_code: string; program_name: string;
    monday_board_id: string | null; monday_item_id: string | null;
    last_synced_at: Date | null; sync_status: string;
  }[]>`
    SELECT mpm.id, p.code AS program_code, p.title_ar AS program_name,
      mpm.monday_board_id, mpm.monday_item_id, mpm.last_synced_at, mpm.sync_status
    FROM monday_program_mappings mpm
    JOIN ecosystem_programs p ON p.id = mpm.program_id
    ORDER BY mpm.last_synced_at DESC NULLS LAST
  `.catch(() => []);

  // recent log
  const log = await db<{
    id: number; direction: string; entity_type: string; entity_id: number | null;
    monday_id: string | null; status: string | null; message: string | null;
    created_at: Date;
  }[]>`
    SELECT id, direction, entity_type, entity_id, monday_id, status, message, created_at
    FROM monday_sync_log
    WHERE tenant = 'qtech'
    ORDER BY created_at DESC LIMIT 20
  `.catch(() => []);

  const isConnected = config.api_token_set;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4, fontWeight: 700 }}>تكامل monday.com</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
          مزامنة ثنائية الاتجاه بين قدراتك ولوحة monday.com — البرامج، المهام، التحديثات
        </p>
      </div>

      {/* حالة الاتصال */}
      <div style={{
        background: isConnected ? 'var(--success-bg)' : 'var(--warning-bg)',
        border: `1px solid ${isConnected ? 'var(--success)' : 'var(--warning)'}`,
        borderRadius: 14, padding: 20, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: isConnected ? 'var(--success)' : 'var(--warning)',
          color: '#fff', display: 'grid', placeItems: 'center',
        }}>
          <Plug size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: isConnected ? 'var(--success)' : 'var(--warning)' }}>
            {isConnected ? 'متّصل بـ monday.com' : 'لم يتم الإعداد بعد'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
            {isConnected
              ? `الاتجاه: ${config.sync_direction === 'bidirectional' ? 'ثنائي ↔️' : config.sync_direction === 'pull_only' ? 'سحب فقط ←' : 'دفع فقط →'}`
              : 'أضف API token في الإعدادات للبدء'}
          </p>
        </div>
        <button style={{
          padding: '10px 16px', background: isConnected ? 'var(--bg-2)' : 'var(--primary)',
          color: isConnected ? 'var(--text)' : '#fff', border: 0, borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Settings size={14} /> {isConnected ? 'إعدادات' : 'إعداد الاتصال'}
        </button>
      </div>

      {/* ميزات */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        <FeatureCard icon={<ArrowRightLeft size={18} />} title="مزامنة ثنائية" desc="التحديثات في الطرفين تنعكس على الآخر" enabled={isConnected} />
        <FeatureCard icon={<RefreshCw size={18} />} title="مزامنة تلقائية" desc="تشغيل دوري كل ١٥ دقيقة" enabled={isConnected} />
        <FeatureCard icon={<Check size={18} />} title="حل التعارضات" desc="آخر تعديل يربح" enabled={isConnected} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* mappings */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>البرامج المرتبطة</h3>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{mappings.length} برنامج</span>
          </div>
          {mappings.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              لم يتم ربط أي برامج بـ monday بعد
            </div>
          ) : (
            <div>
              {mappings.map((m) => (
                <div key={m.id} style={{
                  padding: '12px 18px', borderBottom: '1px solid var(--line-soft)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.program_name}</div>
                    <code style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {m.program_code} {m.monday_board_id && `↔ board:${m.monday_board_id}`}
                    </code>
                  </div>
                  <Pill tone={m.sync_status === 'synced' ? 'success' : m.sync_status === 'failed' ? 'danger' : 'warning'}>
                    {m.sync_status === 'synced' ? '✓ متزامن' : m.sync_status === 'failed' ? '✗ فشل' : '⏳ معلّق'}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* sync log */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--line)',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>سجل المزامنة</h3>
          </div>
          {log.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              لا يوجد سجل
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              {log.map((l) => (
                <div key={l.id} style={{
                  padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{l.direction === 'pull' ? '⬅️' : '➡️'}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{l.entity_type}</span>
                    <Pill tone={l.status === 'success' ? 'success' : 'danger'}>{l.status}</Pill>
                  </div>
                  {l.message && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.message}</p>}
                  <p style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(l.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, enabled }: { icon: React.ReactNode; title: string; desc: string; enabled: boolean }) {
  return (
    <div style={{
      padding: 16, background: 'var(--surface)',
      border: '1px solid var(--line)', borderRadius: 12,
      opacity: enabled ? 1 : 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
        <h4 style={{ fontSize: 13, fontWeight: 600 }}>{title}</h4>
        {enabled && <Check size={12} style={{ color: 'var(--success)', marginInlineStart: 'auto' }} />}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{desc}</p>
    </div>
  );
}
