FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Expose port (default 8000, can be overridden)
EXPOSE 8000

# Start the server
CMD ["npm", "start"]

