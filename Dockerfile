# syntax=docker/dockerfile:1

# NOTE: this image has not been built or run by the maintainer yet (no Docker
# available on the development machine). Treat it as a starting point and
# report issues if a stage fails.

# ---------- 1. Install dependencies (runs prisma generate via postinstall) ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma needs the schema + config (and the stub-fix script) during postinstall.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts

RUN npm ci --no-audit --no-fund

# ---------- 2. Build the Next.js app ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders only: nothing connects to the database during
# `next build`. Real values are injected at runtime (see docker run below).
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=require" \
    DIRECT_URL="postgresql://user:pass@localhost:5432/db?sslmode=require" \
    AUTH_SECRET="build-placeholder" \
    AUTH_URL="http://localhost:3000" \
    AUTH_TRUST_HOST="true"
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ---------- 3. Minimal runtime image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# output: "standalone" emits a self-contained server with only the files it traced.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# The generated Prisma client (incl. its WASM query compiler) is not always
# picked up by file tracing, so copy it explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

# Build:
#   docker build -t karya --build-arg NEXT_PUBLIC_APP_URL=https://your-domain .
# Run (pass real secrets at runtime, never bake them into the image):
#   docker run -p 3000:3000 --env-file .env karya
