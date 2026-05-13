import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegram, TelegramTemplates } from '@/lib/notifications/telegram';
import { sendEmail } from '@/lib/notifications/email';

/**
 * Telegram webhook handler
 *
 * Telegram يرسل updates هنا عند:
 *  1. ضغط محمد على زر ✅/❌ في رسالة التسجيل
 *  2. كتابة /commands للبوت
 *
 * Setup:
 *  curl -F "url=https://qtech.help/api/telegram/webhook" \
 *       -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
 *       https://api.telegram.org/bot$TOKEN/setWebhook
 */

export async function POST(req: NextRequest) {
  // 1) Validate secret token
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
  }

  const update = await req.json();

  // 2) Handle inline button click (callback_query)
  if (update.callback_query) {
    return handleCallback(update.callback_query);
  }

  // 3) Handle text commands
  if (update.message?.text) {
    return handleMessage(update.message);
  }

  return NextResponse.json({ ok: true });
}

async function handleCallback(cb: {
  id: string;
  data: string;
  from: { id: number };
  message: { chat: { id: number }; message_id: number };
}) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminId && String(cb.from.id) !== String(adminId)) {
    return ackCallback(cb.id, 'غير مصرّح');
  }

  // data format: "approve:42" or "reject:42"
  const [action, idStr] = (cb.data || '').split(':');
  const requestId = parseInt(idStr || '0', 10);
  if (!requestId) return ackCallback(cb.id, 'request_id غير صالح');

  // Get registration
  const reqs = await db<{
    id: number; email: string; name_ar: string; tenant_id: string; status: string;
  }[]>`
    SELECT id, email, name_ar, tenant_id, status
    FROM registration_requests WHERE id = ${requestId}
  `;
  if (reqs.length === 0) return ackCallback(cb.id, 'الطلب غير موجود');
  const r = reqs[0];

  if (r.status !== 'pending') {
    return ackCallback(cb.id, `الطلب تمّت معالجته مسبقاً (${r.status})`);
  }

  if (action === 'approve') {
    // 1) update status
    await db`
      UPDATE registration_requests SET status = 'approved', reviewed_at = NOW()
      WHERE id = ${requestId}
    `;
    await db`
      UPDATE users SET status = 'active', is_active = true
      WHERE email = ${r.email}
    `;

    // 2) audit
    await db`
      INSERT INTO audit_log (event, tenant_id, metadata)
      VALUES ('registration_approved_via_telegram', ${r.tenant_id}, ${db.json({ request_id: requestId, email: r.email })})
    `.catch(() => {});

    // 3) send welcome email with login link
    const tenantHosts: Record<string, string> = {
      qtech: 'qtech.help',
      advice: 'advicedga.cloud',
      omary: 'app.omary.cloud',
    };
    const host = tenantHosts[r.tenant_id] || 'qtech.help';
    await sendEmail({
      to: r.email,
      subject: 'تم قبول طلبك — قدراتك',
      html: `
        <p>السلام عليكم ${r.name_ar}،</p>
        <p>تم قبول طلب تسجيلك. يمكنك الدخول من الرابط التالي:</p>
        <p><a href="https://${host}/login" style="display:inline-block;padding:12px 24px;background:#7c32c9;color:#fff;text-decoration:none;border-radius:6px;">دخول الآن</a></p>
      `,
    });

    // 4) update Telegram message
    await editMessage(cb.message.chat.id, cb.message.message_id, `✅ <b>تم قبول التسجيل</b>\n\n👤 ${r.name_ar}\n📧 ${r.email}\n🏛️ ${r.tenant_id}\n\n<i>أُرسل رابط الدخول للموظف.</i>`);
    return ackCallback(cb.id, '✅ تم القبول');
  }

  if (action === 'reject') {
    await db`UPDATE registration_requests SET status = 'rejected', reviewed_at = NOW() WHERE id = ${requestId}`;
    await editMessage(cb.message.chat.id, cb.message.message_id, `❌ <b>تم رفض التسجيل</b>\n\n👤 ${r.name_ar}\n📧 ${r.email}`);
    return ackCallback(cb.id, '❌ تم الرفض');
  }

  return ackCallback(cb.id, 'إجراء غير معروف');
}

async function handleMessage(msg: { chat: { id: number }; from?: { id: number }; text: string }) {
  const text = msg.text.trim();
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const isAdmin = adminId && msg.from && String(msg.from.id) === String(adminId);

  if (text === '/start') {
    await sendTelegram({
      chatId: msg.chat.id,
      text: '👋 أهلاً! أنا بوت قدراتك.\n\nسأرسل لك تنبيهات عند:\n• تسجيلات جديدة (مع أزرار قبول/رفض)\n• تنبيهات البرامج\n• تحديثات الفريق',
    });
    return NextResponse.json({ ok: true });
  }

  if (text === '/pending' && isAdmin) {
    const pending = await db<{ id: number; email: string; name_ar: string; tenant_id: string }[]>`
      SELECT id, email, name_ar, tenant_id FROM registration_requests
      WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10
    `.catch(() => []);

    if (pending.length === 0) {
      await sendTelegram({ chatId: msg.chat.id, text: '✨ لا توجد طلبات معلّقة' });
    } else {
      for (const p of pending) {
        await sendApprovalMessage(msg.chat.id, p);
      }
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

/* ═══ Helpers ════════════════════════════════════════════════════════ */

async function ackCallback(callbackId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false });
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: false }),
  });
  return NextResponse.json({ ok: true });
}

async function editMessage(chatId: number, messageId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  });
}

export async function sendApprovalMessage(chatId: number | string, req: { id: number; email: string; name_ar: string; tenant_id: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const text = `🆕 <b>تسجيل جديد</b>\n\n` +
    `👤 ${req.name_ar}\n` +
    `📧 ${req.email}\n` +
    `🏛️ البوابة: ${req.tenant_id}\n\n` +
    `<i>اضغط للموافقة أو الرفض:</i>`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ قبول', callback_data: `approve:${req.id}` },
          { text: '❌ رفض', callback_data: `reject:${req.id}` },
        ]],
      },
    }),
  });
}
