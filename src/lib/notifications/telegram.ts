/**
 * Telegram notification utility.
 * يُستخدم لإرسال تنبيهات للموظفين عند الأحداث المهمّة (تسجيل جديد، ترشيح، إلخ).
 *
 * Usage:
 *   await sendTelegram({
 *     chatId: process.env.TELEGRAM_ADMIN_CHAT_ID!,
 *     text: '🎓 تسجيل جديد: محمد أحمد',
 *   });
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

interface SendOpts {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'MarkdownV2';
  silent?: boolean;
}

export async function sendTelegram(opts: SendOpts): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — notification skipped');
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: opts.chatId,
        text: opts.text,
        parse_mode: opts.parseMode || 'HTML',
        disable_notification: opts.silent || false,
      }),
    });
    if (!res.ok) {
      console.error('[telegram] HTTP', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[telegram] error:', e);
    return false;
  }
}

/** يُرسل تنبيهاً للأدمن (للأحداث العامة على النظام) */
export async function notifyAdmin(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return false;
  return sendTelegram({ chatId, text });
}

/** قوالب جاهزة للأحداث الشائعة */
export const TelegramTemplates = {
  newRegistration: (name: string, email: string, tenant: string) =>
    `🆕 <b>تسجيل جديد</b>\n\n` +
    `👤 ${name}\n` +
    `📧 ${email}\n` +
    `🏛️ البوابة: ${tenant}\n` +
    `⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}\n\n` +
    `يحتاج موافقة من لوحة التحكم.`,

  registrationApproved: (name: string, tenant: string) =>
    `✅ <b>تم قبول التسجيل</b>\n\n` +
    `👤 ${name}\n` +
    `🏛️ ${tenant}\n` +
    `أُرسل رابط الدخول للموظف عبر الإيميل.`,

  newNomination: (programName: string, nominee: string, entity: string) =>
    `📨 <b>ترشيح جديد</b>\n\n` +
    `📚 البرنامج: ${programName}\n` +
    `👤 المرشّح: ${nominee}\n` +
    `🏛️ الجهة: ${entity}`,

  programAlert: (programName: string, alert: string) =>
    `⚠️ <b>تنبيه برنامج</b>\n\n` +
    `📚 ${programName}\n\n` +
    `${alert}`,
};
