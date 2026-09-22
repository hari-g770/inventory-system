# Dockerfile – Build and serve Finefix React app

# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (package-lock ensures reproducible builds)
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install a tiny static file server (serve) globally
RUN npm i -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the static server will listen on
EXPOSE 3000

# Command to serve the static build directory on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
