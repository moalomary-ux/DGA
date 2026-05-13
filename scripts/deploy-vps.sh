#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# qtech-platform — VPS deployment script
# يُشغَّل من Mac mini ليرفع المشروع للـ VPS Hostinger
# ─────────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="${VPS_HOST:-root@187.77.79.237}"
VPS_PATH="/opt/qtech-platform"
LOCAL_PATH="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Deploying qtech-platform to $VPS_HOST"
echo "   from: $LOCAL_PATH"
echo "   to:   $VPS_HOST:$VPS_PATH"
echo ""

# (1) رفع الكود (rsync — أسرع وأذكى من scp)
echo "▶ rsync project files..."
rsync -avz --delete \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=.env.local \
  --exclude='*.log' \
  "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"

# (2) بناء + إعادة تشغيل
ssh "$VPS_HOST" bash -s << 'REMOTE'
set -euo pipefail
cd /opt/sami

echo "▶ Building qtech-platform image..."
docker compose build qtech-platform

echo "▶ Restarting service..."
docker compose up -d qtech-platform

echo "▶ Status:"
docker compose ps qtech-platform

echo ""
echo "▶ Recent logs:"
docker compose logs qtech-platform --tail=20
REMOTE

echo ""
echo "✅ Deploy complete!"
echo "   Test: https://qtech.help"
