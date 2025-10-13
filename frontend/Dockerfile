FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files first to leverage cache
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --network-timeout 600000

# Copy source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["yarn", "dev"]
