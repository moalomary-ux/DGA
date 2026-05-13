# 🚀 Beta Launch — Step by Step

دليل النشر الكامل للـ Beta على VPS Frankfurt مع الربط الكامل بـ Hermes Agent على Mac mini Riyadh.

---

## ✅ المتطلبات

على Mac mini (محلياً):
- ✅ كود qtech-platform في `~/Downloads/qtech-platform/`
- ✅ WireGuard tunnel نشط (`wg0` إلى VPS)
- ✅ Bridge API على Port 7080 (Hermes Agent v0.11)
- ✅ Bridge token: `yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU` (من SAMI_QUICK_REF)

على VPS Frankfurt:
- ✅ Docker + Docker Compose
- ✅ Postgres (`sami-postgres`) شغّال
- ✅ Traefik (`sami-traefik`) شغّال
- ✅ DNS A records: qtech.help / advicedga.cloud / app.omary.cloud → 187.77.79.237

في Telegram:
- ✅ بوت `@Macomarybot` فعّال (التوكن في Hermes config)
- ⚠️ Chat ID لمحمد (نستخرجه)

---

## 🎯 الخطة (90 دقيقة)

| الخطوة | المدة | تشغيل من |
|---|---|---|
| 1. تحضير .env | 5 دقائق | Mac mini |
| 2. رفع الكود لـ VPS | 5 دقائق | Mac mini |
| 3. تطبيق migrations | 3 دقائق | VPS |
| 4. دمج docker-compose | 5 دقائق | VPS |
| 5. بناء + تشغيل qtech-platform | 5-7 دقائق | VPS |
| 6. ربط Telegram webhook | 3 دقائق | curl |
| 7. اختبار end-to-end | 30 دقيقة | يدوي |
| 8. دعوة موظف للاختبار | حسب الموظف | Mohammed |

---

## 1) تحضير .env

### استخرج Telegram Chat ID
على Mac mini:
```bash
TG_TOKEN="<توكن @Macomarybot من Hermes config>"

# ابعث رسالة لـ @Macomarybot من حسابك أولاً
# ثم:
curl -s "https://api.telegram.org/bot$TG_TOKEN/getUpdates" | jq '.result[-1].message.from.id'
# سترى رقم مثل: 123456789
```

### استخرج Hostinger SMTP password
موجود في SAMI_QUICK_REF: `mhm@FEB2026` لكل من 3 إيميلات.

---

## 2) رفع الكود لـ VPS

```bash
cd ~/Downloads/qtech-platform
chmod +x scripts/deploy-vps.sh scripts/vps-setup.sh
./scripts/deploy-vps.sh
```

السكربت يعمل rsync من Mac mini إلى `/opt/qtech-platform/` على VPS.

---

## 3) تطبيق migrations + setup

```bash
ssh root@187.77.79.237
cd /opt/qtech-platform
./scripts/vps-setup.sh
```

السكربت:
- يطبّق migrations 001-011 على `sami-postgres`
- يدمج خدمة qtech-platform في `/opt/sami/docker-compose.yml`
- يضيف env vars في `/opt/sami/.env`

---

## 4) عبّي env vars

على VPS:
```bash
nano /opt/sami/.env
```

عدّل القيم:
```bash
# qtech-platform
QTECH_SESSION_SECRET=<هيتولّد تلقائياً من السكربت>
QTECH_SMTP_PASS=mhm@FEB2026

# Bridge (الربط بـ Mac mini Riyadh عبر WireGuard)
BRIDGE_URL=http://10.10.10.2:7080
BRIDGE_TOKEN=yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU

# Telegram
TELEGRAM_BOT_TOKEN=<توكن @Macomarybot>
TELEGRAM_ADMIN_CHAT_ID=<chat ID اللي استخرجته فوق>
TELEGRAM_WEBHOOK_SECRET=<اخترع نص عشوائي 32 حرف>

# اختياري
MONDAY_API_TOKEN=
```

---

## 5) شغّل الـ service

```bash
cd /opt/sami
docker compose up -d --build qtech-platform
docker compose logs qtech-platform -f
```

ابحث عن:
```
✓ Ready on port 3000
```

---

## 6) ربط Telegram webhook

من VPS:
```bash
source /opt/sami/.env
curl -F "url=https://qtech.help/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
```

النتيجة المتوقّعة:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

اختبر:
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq
```

ابعت `/start` للبوت من Telegram → يجب أن يرد بـ "أهلاً! أنا بوت قدراتك..."

---

## 7) اختبار End-to-End

### اختبار 1: تسجيل + قبول عبر Telegram
1. افتح https://qtech.help/register بـ "جلسة خفيّة"
2. عبّي بيانات وهمية (test@dga.gov.sa)
3. ابعت
4. **في Telegram**: محمد يستلم رسالة:
   ```
   🆕 تسجيل جديد
   👤 ...
   📧 test@dga.gov.sa
   [✅ قبول] [❌ رفض]
   ```
5. اضغط ✅
6. الرسالة تتحدّث: "✅ تم قبول التسجيل · أُرسل رابط الدخول"
7. test@dga.gov.sa يستلم welcome email

### اختبار 2: محادثة وكيل
1. ادخل https://qtech.help كمحمد
2. اذهب لـ /agents
3. اضغط "فتح المحادثة" على Email Composer
4. اكتب: "اكتب رسالة قبول للمتدرّبين"
5. الرد سيأتي من Hermes Agent → Claude Sonnet 4.6
6. لو الـ Bridge مش متصل، ستظهر رسالة واضحة:
   "🔌 المحرّك (Mac mini Riyadh) غير متصل حالياً. تحقّق من WireGuard tunnel."

### اختبار 3: التقويم + البرامج
1. /calendar → ألوان حسب نوع البرنامج
2. /programs → اضغط على أي برنامج → التابات السبعة

---

## 🐛 التشخيص

### السيرفر مش طالع
```bash
docker compose logs qtech-platform --tail=100
```
ابحث عن: `Error`, `EACCES`, `ECONN`

### الوكلاء يرجعون "غير متصل"
المشكلة: WireGuard من VPS إلى Mac mini مش شغّال.

```bash
# على VPS
ping 10.10.10.2  # Mac mini

# على Mac mini
sudo wg show
```

لو مفصول:
```bash
# على Mac mini
sudo wg-quick up ~/.sami/wireguard/wg0.conf
```

### Telegram callback مش يشتغل
```bash
# اقرأ logs
docker compose logs qtech-platform | grep telegram
```

تأكد من:
- `TELEGRAM_WEBHOOK_SECRET` متطابق بين Telegram و qtech-platform
- Webhook URL صحيح (HTTPS فقط)

### إيميل القبول ما يصل
```bash
docker exec -it qtech-platform sh
# داخل الكونتينر:
nc -zv smtp.hostinger.com 465
```

تحقّق من `SMTP_USER` و `SMTP_PASS` في `.env`.

---

## 📋 Checklist قبل دعوة الموظفين

- [ ] qtech.help يفتح بـ HTTPS بدون أخطاء
- [ ] /login يعمل + OTP يصل بالإيميل
- [ ] /register → Telegram inline buttons → Approve → email يصل
- [ ] /calendar /programs /data-center /communication /forum كلها تفتح
- [ ] /agents/email-composer يرد فعلاً (مش fallback message)
- [ ] backup يومي للـ DB مفعّل (cron)
- [ ] Mohammed أضاف 5-10 برامج حقيقية + جهات + متدربين

---

## 🔮 بعد Beta

الأولويات:
1. **Skills marketplace** — كل skill من 240 يكون متاح كـ widget
2. **File upload** — رفع ملفات للبرامج/التعليقات
3. **monday.com sync** فعلي
4. **Auto-send emails** بدون .eml manual
5. **Voice via Telegram** — محمد يبعث صوتي للبوت → Hermes ينفّذ
