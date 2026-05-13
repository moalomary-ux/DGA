# ─────────────────────────────────────────────────
# qtech-platform — Multi-stage Production Dockerfile
# ─────────────────────────────────────────────────

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"
# Build-time placeholders (تُستبدل تلقائياً وقت runtime من docker-compose)
ENV DATABASE_URL="postgres://build:build@localhost:5432/build"
ENV BRIDGE_URL="http://localhost:7080"
ENV BRIDGE_TOKEN="build_placeholder"
ENV TELEGRAM_BOT_TOKEN="build_placeholder"
ENV TELEGRAM_ADMIN_CHAT_ID="0"
ENV TELEGRAM_WEBHOOK_SECRET="build_placeholder"
ENV SESSION_SECRET="build_time_placeholder_replaced_at_runtime_min32"
ENV SMTP_HOST="smtp.example.com"
ENV SMTP_PORT="465"
ENV SMTP_USER="build@example.com"
ENV SMTP_PASS="build_placeholder"
ENV SMTP_FROM="Build <build@example.com>"

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Standalone output (much smaller image)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
