# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# ENV DIRECTUS_URL=https://directus-doc2markdown.aimazing.site
ARG DIRECTUS_URL=https://directus-backlinkflow.aimazing.site
#ENV POSTGRES_URL="postgres://postgres:postRy78XT@192.210.248.10:5432/social_insights"
#ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY3ZpbnRlcnZ1LmNvbSQ
ENV NEXT_PUBLIC_APP_URL=https://backlinkflow.app

RUN --mount=type=secret,id=directus_token \
  DIRECTUS_URL=$DIRECTUS_URL \
  DIRECTUS_TOKEN="$(cat /run/secrets/directus_token)" \
  npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
