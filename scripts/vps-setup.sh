#!/usr/bin/env bash
# يُشغَّل مرة واحدة على VPS لتجهيز qtech-platform داخل /opt/sami
set -euo pipefail

cd /opt/sami

# (1) تشغيل migrations
echo "▶ Running migrations..."
for m in /opt/qtech-platform/migrations/*.sql; do
  echo "  - $(basename "$m")"
  docker exec -i sami-postgres psql -U sami -d sami < "$m" 2>&1 | grep -v "NOTICE" | grep -v "^$" || true
done

# (2) دمج خدمة qtech-platform في docker-compose.yml
if ! grep -q "qtech-platform:" /opt/sami/docker-compose.yml; then
  echo "▶ Adding qtech-platform service to docker-compose.yml"
  cat /opt/qtech-platform/docker-compose.qtech.yml >> /opt/sami/docker-compose.yml
fi

# (3) أضف environment vars المطلوبة
if ! grep -q "QTECH_SESSION_SECRET" /opt/sami/.env; then
  SECRET=$(openssl rand -hex 32)
  cat >> /opt/sami/.env << ENV

# ─── qtech-platform ───
QTECH_SESSION_SECRET=${SECRET}
QTECH_SMTP_PASS=mhm@FEB2026

# ─── Bridge (الربط بـ Mac mini Riyadh عبر WireGuard) ───
BRIDGE_URL=http://10.10.10.2:7080
BRIDGE_TOKEN=                   # ← انسخ من ~/.sami/.env على Mac mini

# ─── Telegram (للتنبيهات + inline approval) ───
TELEGRAM_BOT_TOKEN=              # ← توكن @Macomarybot
TELEGRAM_ADMIN_CHAT_ID=          # ← Chat ID لمحمد
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 24)

# ─── monday.com (اختياري) ───
MONDAY_API_TOKEN=
ENV
  echo "▶ Added env template to /opt/sami/.env"
  echo "  ⚠️  حدّث القيم البيضاء قبل التشغيل"
fi

echo ""
echo "✅ Setup ready."
echo ""
echo "الخطوات التالية:"
echo "  1. nano /opt/sami/.env  # عبّي BRIDGE_TOKEN + TELEGRAM_*"
echo "  2. cd /opt/sami && docker compose up -d --build qtech-platform"
echo "  3. ربط Telegram webhook (انظر BETA-LAUNCH.md خطوة 6)"
