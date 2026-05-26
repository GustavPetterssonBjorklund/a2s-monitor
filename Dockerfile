FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
RUN corepack enable
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

FROM base AS deps
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm exec svelte-kit sync
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
ENV PORT="3000"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node build"]
