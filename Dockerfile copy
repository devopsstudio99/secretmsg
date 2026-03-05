# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy public files
COPY public ./public

# Copy database files
COPY src/database ./src/database
COPY src/config ./src/config

# Create logs directory
RUN mkdir -p logs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/messages/healthcheck', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
