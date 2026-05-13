// ════════════════════════════════════════════════════════════════
// Email body utilities v3 — Disclaimer/Footer Detection
// ════════════════════════════════════════════════════════════════

export function cleanEmailHtml(html: string): string {
  if (!html) return '';
  let cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/CAUTION:\s*This email originated[^<]*?safe\./gi, '');
  return cleaned.trim();
}

/**
 * يحدد إذا السطر يبدأ "نص مقتبس" (quoted text):
 * - "From:" / "Sent:" / "To:" / "Subject:"
 * - "On <date> wrote:"
 * - "في <date> كتب:"
 * - "Begin forwarded message:"
 * - بداية disclaimer:
 *   - "Disclaimer: This message"
 *   - "إخلاء المسؤولية"
 *   - "This email and any files transmitted"
 *   - "The information in this email"
 *   - "This message and its attachment"
 *   - "Confidentiality Notice"
 *   - "هذا البريد الإلكتروني سري"
 */
function isQuoteHeader(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return (
    /^(From|Sent|To|Cc|Subject|Date)\s*:\s*/i.test(t) ||
    /^>\s*/.test(t) ||
    /^On\s+.+wrote:\s*$/i.test(t) ||
    /^في\s+.+كتب:?\s*$/.test(t) ||
    /^_{3,}|^-{3,}$/.test(t) ||
    /^Begin forwarded message:/i.test(t)
  );
}

function isDisclaimerStart(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return (
    /^Disclaimer\s*:/i.test(t) ||
    /إخلاء المسؤولية/.test(t) ||
    /^This message and its attachment/i.test(t) ||
    /^This email and any files/i.test(t) ||
    /^The information in this email/i.test(t) ||
    /^Confidentiality Notice/i.test(t) ||
    /هذا البريد الإلكتروني (سري|محمي)/.test(t) ||
    /^IMPORTANT NOTICE/i.test(t) ||
    /^Privileged\/Confidential/i.test(t) ||
    /^NOTICE:\s*The information/i.test(t)
  );
}

/**
 * تقسيم النص: original (الجزء الجديد) + quoted/disclaimer (للطي).
 */
function splitOriginalAndQuoted(text: string): { original: string; quoted: string } {
  const lines = text.split('\n');
  let splitIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    
    // 1. اكتشف Disclaimer — قطعي
    if (isDisclaimerStart(t)) { splitIdx = i; break; }
    
    // 2. "From: " مع email في نفس السطر — قوي
    if (/^From\s*:\s*.+@/i.test(t)) { splitIdx = i; break; }
    if (/^On\s+.+wrote:\s*$/i.test(t)) { splitIdx = i; break; }
    if (/^في\s+.+كتب:?\s*$/.test(t)) { splitIdx = i; break; }
    if (/^Begin forwarded message:/i.test(t)) { splitIdx = i; break; }
    
    // 3. عدة header lines متتالية
    if (isQuoteHeader(t)) {
      let count = 0;
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        if (isQuoteHeader(lines[j])) count++;
      }
      if (count >= 2) { splitIdx = i; break; }
    }
  }

  if (splitIdx < 0) return { original: text, quoted: '' };
  return {
    original: lines.slice(0, splitIdx).join('\n').trim(),
    quoted: lines.slice(splitIdx).join('\n').trim(),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function linkify(s: string): string {
  return s
    .replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1">$1</a>');
}

function textToParagraphs(text: string): string {
  if (!text) return '';
  let clean = text.replace(/^\s*CAUTION:\s*This email originated[^.]*?\.\s*Do not click links[^.]*?\.\s*/i, '');
  
  // تنظيف character غريبة (🦠 وغيرها) في خط البداية لو موجودة
  clean = clean.replace(/^\s*🦠[A-Z]*\s*/, '');
  
  // إزالة spaces زائدة في نهاية كل سطر
  clean = clean.split('\n').map((l) => l.replace(/\s+$/g, '')).join('\n');
  
  // قسّم لـ فقرات (double newline أو أكثر)
  const paragraphs = clean.split(/\n\s*\n+/);
  
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      let escaped = escapeHtml(trimmed);
      escaped = linkify(escaped);
      escaped = escaped.replace(/\n/g, '<br>');
      
      // كشف bullets
      if (/^[-•·*]\s/.test(trimmed)) {
        const items = trimmed.split('\n').map((l) => l.replace(/^[-•·*]\s+/, '').trim()).filter(Boolean);
        return '<ul>' + items.map((i) => `<li>${linkify(escapeHtml(i))}</li>`).join('') + '</ul>';
      }
      
      return `<p>${escaped}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export function textToHtml(text: string): string {
  return textToParagraphs(text);
}

export function isRealHtml(html: string): boolean {
  if (!html) return false;
  return /<(p|div|table|h[1-6]|img|a\s|ul|ol|br|strong|em|b|i)\b/i.test(html);
}

/**
 * المعالج الرئيسي — يقسم لـ original + quoted ويولّد HTML لكل قسم.
 */
export function processEmailBody(message: {
  body_html?: string;
  body_text?: string;
}): { originalHtml: string; quotedHtml: string; hasQuoted: boolean } {
  // إذا فيه HTML حقيقي، استخدمه بدون split (يحتفظ بـ formatting)
  if (message.body_html && isRealHtml(message.body_html)) {
    return { originalHtml: cleanEmailHtml(message.body_html), quotedHtml: '', hasQuoted: false };
  }

  const text = message.body_text || message.body_html || '';
  if (!text) {
    return { originalHtml: '<p style="color:#888">(لا يوجد محتوى)</p>', quotedHtml: '', hasQuoted: false };
  }

  const { original, quoted } = splitOriginalAndQuoted(text);
  const originalHtml = textToParagraphs(original) || '<p style="color:#888">(بدون نص جديد)</p>';
  const quotedHtml = quoted ? textToParagraphs(quoted) : '';

  return { originalHtml, quotedHtml, hasQuoted: !!quoted };
}
