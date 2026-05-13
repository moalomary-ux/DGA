import { createHash, randomInt } from 'crypto';

/**
 * توليد رمز OTP من 6 أرقام cryptographically secure
 */
export function generateOTP(): string {
  // randomInt(0, 1000000) ثم padStart يضمن 6 أرقام دائماً
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

/**
 * تحويل الرمز إلى hash بـ SHA-256
 * نخزن الـ hash فقط، ليس الرمز الأصلي
 */
export function hashOTP(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * مقارنة آمنة من حيث الوقت (لمنع timing attacks)
 */
export function verifyOTP(input: string, storedHash: string): boolean {
  const inputHash = hashOTP(input);
  if (inputHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * توليد رمز دعوة بصيغة DGA-XXXXXXXX
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // إزالة I, O, 0, 1 لتجنب اللبس
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[randomInt(0, chars.length)];
  }
  return `DGA-${code}`;
}
