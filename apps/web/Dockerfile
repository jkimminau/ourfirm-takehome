# Next.js client. Build context is the monorepo root:
# `docker build -f apps/web/Dockerfile .`
#
# NEXT_PUBLIC_API_URL is inlined into the client bundle at BUILD time, so it is
# a build arg. For local compose it points at the published server port on the
# host (http://localhost:4000); for a real deploy, pass the backend's URL.

# ---- build ----------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

# `npm install`, not `npm ci` — Heroku's container build omits package-lock.json
# from the build context, so the build can't depend on the lockfile.
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm install --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @ourfirm/web

# ---- runtime --------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone output: a minimal node_modules + server.js, plus static assets and
# public/ (which Next does not trace automatically).
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
