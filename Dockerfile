# Multi-stage Docker build for Railway deployment
# Based on PAD-DEV.md architecture - Express API with CLARA, TIMER, ADAPT services

FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    libc6-compat

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    libc6-compat \
    dumb-init

# Copy built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/api/server.js"]