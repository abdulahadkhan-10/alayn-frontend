FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDeps needed to build)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Install ONLY production dependencies (no devDeps)
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy the built Next.js output from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start"]
