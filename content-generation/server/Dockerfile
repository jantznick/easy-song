FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including production deps)
RUN npm ci --include=dev

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Create directories that will be mounted as volumes
RUN mkdir -p /app/data /app/scripts /app/logs

# Expose port (default 8000, can be overridden)
EXPOSE 8000

# Start the server
CMD ["node", "dist/index.js"]

