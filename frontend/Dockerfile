# ---------- Stage: Frontend (Vite + Node 20) ----------
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependency manifests first
COPY package.json yarn.lock* ./

# Install dependencies with cached yarn store
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --network-timeout 600000

# Copy project files (after deps to preserve cache)
COPY . .

# Environment settings for hot reload
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV HOST=0.0.0.0
ENV PORT=5173

EXPOSE 5173

# Default run command (Vite dev server)
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]
