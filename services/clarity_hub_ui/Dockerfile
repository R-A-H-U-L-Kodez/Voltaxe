# Voltaxe Clarity Hub - React Frontend Dockerfile
# Multi-stage build for production optimization

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S voltaxe -u 1001

# Set ownership
RUN chown -R voltaxe:nodejs /usr/share/nginx/html
RUN chown -R voltaxe:nodejs /var/cache/nginx
RUN chown -R voltaxe:nodejs /var/log/nginx
RUN chown -R voltaxe:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R voltaxe:nodejs /var/run/nginx.pid

# Switch to non-root user
USER voltaxe

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]