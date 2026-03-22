# ===============================================
# Harmony Clay - Multi-stage Docker Build
# Stage 1: Build frontend (Node 20 - Vite 8 requirement)
# ===============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Copiar solo lo necesario para el build
COPY frontend-react/package*.json ./
COPY frontend-react/vite.config.js ./
COPY frontend-react/index.html ./
COPY frontend-react/postcss.config.js ./
COPY frontend-react/tailwind.config.js ./
COPY frontend-react/src/ ./src/
COPY frontend-react/public/ ./public/

# Instalar deps y build
RUN npm ci && npm run build

# ===============================================
# Stage 2: Backend production
# ===============================================
FROM node:20-alpine

LABEL maintainer="Harmony Clay"
LABEL description="Backend API para Harmony Clay"

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# --- Backend ---
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY backend/index.js ./
COPY backend/data/ ./data/

# --- Frontend (from stage 1) ---
COPY --from=frontend-builder /build/frontend/dist ./frontend-react/dist/
COPY --from=frontend-builder /build/frontend/public ./frontend-react/public/

# Crear directorios
RUN mkdir -p /app/logs /app/frontend-react/dist/images && \
    chown -R node:node /app && \
    chmod -R 755 /app

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/pendientes || exit 1

CMD ["node", "index.js"]
