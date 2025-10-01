# Multi-stage build for AiDeer application
FROM node:22-alpine AS base

# Install curl for health check
RUN apk add --no-cache curl

# Build stage
FROM base AS builder
WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Copy backend source code
COPY ./app/backend/ ./backend/
COPY ./app/frontend/ ./frontend/

# Build backend
WORKDIR /app/backend
RUN npm install typescript @types/node -g
RUN npm install --include=dev
RUN echo "=== Installing additional type definitions ==="
RUN npm install @types/sqlite3 @types/fs-extra @types/express @types/cors @types/morgan @types/multer @types/mime-types --save-dev
RUN echo "=== Using tsc with noImplicitAny disabled ==="
RUN tsc --noImplicitAny false

# Build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 aideer

# Copy backend package.json and install production dependencies first
COPY ./app/backend/package*.json ./
# Force npm usage by removing pnpm files and using npm directly
RUN rm -f pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc && \
    npm config set fund false && \
    npm config set audit false && \
    npm install --production --no-package-lock && \
    npm cache clean --force

# Copy built backend application
COPY --from=builder /app/backend/dist ./
COPY --from=builder /app/frontend/dist ./site/

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R aideer:nodejs /app/data

# Set environment variable for data path to the writable directory
ENV AI_DEER_DATA_PATH=/app/data

# Change ownership to non-root user
RUN chown -R aideer:nodejs /app
USER aideer

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "index.js"]