# Một image duy nhất: backend NestJS phục vụ luôn bản build React.
# Dùng cho Render (render.yaml) và cho infra/docker/docker-compose.yml.

# 1) Build frontend
FROM node:24-alpine AS frontend
WORKDIR /src
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci
COPY apps/frontend/ ./
RUN npm run build

# 2) Build backend
FROM node:24-alpine AS backend
WORKDIR /src
COPY apps/backend/package.json apps/backend/package-lock.json ./
RUN npm ci
COPY apps/backend/ ./
RUN npm run build && npm prune --omit=dev

# 3) Image chạy thật
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    SERVE_STATIC_DIR=/app/public
COPY --from=backend /src/package.json ./
COPY --from=backend /src/node_modules ./node_modules
COPY --from=backend /src/dist ./dist
COPY --from=frontend /src/dist ./public
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "dist/main.js"]
