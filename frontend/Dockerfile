FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ARG NEXT_PUBLIC_AUTH_ENABLED=false
ARG NEXT_PUBLIC_KEYCLOAK_URL=http://localhost/auth
ARG NEXT_PUBLIC_KEYCLOAK_REALM=agencyos
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=agencyos-web
ARG NEXT_PUBLIC_TENANT_ID
ARG NEXT_PUBLIC_WORKSPACE_ID
ARG NEXT_PUBLIC_DEV_TENANT_ID
ARG NEXT_PUBLIC_DEV_WORKSPACE_ID
ARG NEXT_PUBLIC_DEV_USER_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_ENABLED=$NEXT_PUBLIC_AUTH_ENABLED
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_TENANT_ID=$NEXT_PUBLIC_TENANT_ID
ENV NEXT_PUBLIC_WORKSPACE_ID=$NEXT_PUBLIC_WORKSPACE_ID
ENV NEXT_PUBLIC_DEV_TENANT_ID=$NEXT_PUBLIC_DEV_TENANT_ID
ENV NEXT_PUBLIC_DEV_WORKSPACE_ID=$NEXT_PUBLIC_DEV_WORKSPACE_ID
ENV NEXT_PUBLIC_DEV_USER_ID=$NEXT_PUBLIC_DEV_USER_ID
ENV DOCKER_BUILD=true
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @agencyos/shared build
RUN pnpm --filter @agencyos/frontend build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S agencyos && adduser -S agencyos -G agencyos
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public
RUN chown -R agencyos:agencyos /app
USER agencyos
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "frontend/server.js"]
