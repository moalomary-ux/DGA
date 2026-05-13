# 🚀 qtech-platform — VPS Deployment Guide

دليل النشر الكامل على VPS Hostinger (`187.77.79.237`).

---

## 🎯 الفلسفة

نستخدم **نفس الـ infrastructure** الموجود في `/opt/sami`:
- ✅ Postgres الموجود (`sami-postgres` container على نفس DB)
- ✅ Traefik الموجود (يدير SSL + routing)
- ✅ شبكة `sami-network` المشتركة
- ✅ Hostinger SMTP للإيميلات
- ✅ Telegram bot `@Macomarybot` للتنبيهات

نضيف **خدمة جديدة فقط**: `qtech-platform`.

---

## 📋 المتطلبات

على Mac mini:
- ✅ SSH access لـ VPS (موجود)
- ✅ كود المشروع في `~/Downloads/qtech-platform/`

على VPS:
- ✅ Docker + Docker Compose
- ✅ Postgres شغّال (`sami-postgres`)
- ✅ Traefik شغّال
- ⚠️ توكن Telegram bot

---

## 🛠️ الخطوات (مرّة واحدة)

### 1) رفع الكود لأول مرّة

```bash
cd ~/Downloads/qtech-platform
./scripts/deploy-vps.sh
```

(السكربت يستخدم rsync، يستثني `node_modules` و `.next` و `.git`)

### 2) إعداد الـ VPS

ادخل VPS:
```bash
ssh root@187.77.79.237
cd /opt/qtech-platform
./scripts/vps-setup.sh
```

السكربت يسوي:
- يشغّل migrations كلها (001 → 010)
- يدمج خدمة qtech-platform في `/opt/sami/docker-compose.yml`
- يضيف env vars في `/opt/sami/.env`

### 3) عبّي الـ env vars

```bash
nano /opt/sami/.env
```

عدّل القيم:
```
QTECH_SESSION_SECRET=<أوتو generate>
QTECH_SMTP_PASS=mhm@FEB2026
TELEGRAM_BOT_TOKEN=<توكن @Macomarybot>
TELEGRAM_ADMIN_CHAT_ID=<chat ID الخاص بك>
MONDAY_API_TOKEN=<اختياري>
```

#### كيف تجيب TELEGRAM_BOT_TOKEN
بوت `@Macomarybot` موجود — التوكن في إعداد Hermes Agent.
```bash
ssh root@187.77.79.237
grep TELEGRAM_BOT_TOKEN /opt/sami/.env  # موجود مسبقاً؟
# لو ما موجود، استخرج من Hermes config على Mac mini
```

#### كيف تجيب TELEGRAM_ADMIN_CHAT_ID
أرسل أي رسالة لـ @Macomarybot ثم:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getUpdates" | jq '.result[0].message.chat.id'
```

### 4) شغّل الـ service

```bash
cd /opt/sami
docker compose up -d --build qtech-platform
docker compose logs qtech-platform -f
```

اختبر:
- https://qtech.help (qtech tenant)
- https://advicedga.cloud (advice tenant)
- https://app.omary.cloud (omary tenant)

---

## 🔁 Deploy تحديثات لاحقة

```bash
# على Mac mini
cd ~/Downloads/qtech-platform
./scripts/deploy-vps.sh
```

يأخذ ~30 ثانية للـ rsync + ~2-3 دقائق للـ Docker build.

---

## 🔧 Migrations جديدة

كل ما تضيف ملف migration:

```bash
# Mac mini
./scripts/deploy-vps.sh

# VPS
ssh root@187.77.79.237
docker exec -i sami-postgres psql -U sami -d sami < /opt/qtech-platform/migrations/011_NEW.sql
```

---

## 🔍 التشخيص

### الـ container ما يطلع
```bash
docker compose logs qtech-platform --tail=100
```

### مشاكل DB
```bash
docker exec -it sami-postgres psql -U sami -d sami
\dt    # list tables
\d users
```

### مشاكل Traefik / SSL
```bash
docker compose logs traefik --tail=50
ls /opt/sami/traefik/letsencrypt/  # شهادات SSL
```

### Restart نظيف
```bash
docker compose restart qtech-platform
```

### Rebuild كامل (لو بعد تحديث dependencies)
```bash
docker compose build --no-cache qtech-platform
docker compose up -d qtech-platform
```

---

## 📊 الموارد

| Service | RAM | CPU |
|---|---|---|
| qtech-platform | ~512MB | منخفض |
| sami-postgres   | ~256MB | منخفض |
| traefik         | ~64MB  | منخفض |
| **إجمالي**       | **~900MB** | — |

VPS Hostinger 2GB+ يكفي براحة.

---

## ⚠️ مهم

- ❌ **لا تشغل migrations on production بدون نسخة احتياطية أولاً**:
  ```bash
  docker exec sami-postgres pg_dump -U sami sami > /opt/sami/backups/pre-deploy-$(date +%Y%m%d).sql
  ```

- ❌ **لا تحذف `/opt/sami/postgres/data/`** — يمسح كل المستخدمين والبرامج

- ✅ **خذ backup يومي**:
  ```bash
  # cron: 0 2 * * *
  docker exec sami-postgres pg_dump -U sami sami | gzip > /opt/sami/backups/$(date +\%Y\%m\%d).sql.gz
  ```

---

## 🔮 خطوات تالية بعد الـ Beta

1. **Telegram webhook** للأوامر (محمد يبعت `/programs` للبوت → يرد بقائمة)
2. **Email auto-send** بدل إنشاء `.eml` (متى ما الموظف اعتمد القالب)
3. **monday.com sync** فعلي (بـ cron job داخل الـ container)
4. **Multi-region backup** لـ S3 أو Hostinger storage
5. **Monitoring**: Uptime Kuma + Grafana
