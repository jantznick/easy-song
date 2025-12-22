# Docker Setup for Content Generation

This guide explains how to run the content generation server and frontend using Docker.

## Quick Start

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` to set your ports:**
   ```env
   SERVER_PORT=8000
   FRONTEND_PORT=5173
   ```

3. **Build and start:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173 (or your configured port)
   - API: http://localhost:8000 (or your configured port)

## Configuration

### Port Configuration

Edit the `.env` file to change ports:

```env
SERVER_PORT=8000      # Backend API port
FRONTEND_PORT=5173    # Frontend web port
```

### Environment Variables

The following environment variables can be set in `.env`:

- `SERVER_PORT` - Port for the backend server (default: 8000)
- `FRONTEND_PORT` - Port for the frontend (default: 5173)
- `VITE_API_URL` - API URL for frontend (default: http://localhost:8000)
  - In Docker, this is automatically set to `http://server:8000`

### Data Persistence

The following directories are mounted as volumes for data persistence:

- `./data` - All generated content files
- `./scripts` - Processing scripts
- `./logs` - Process logs

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Stop and remove containers
```bash
docker-compose down -v
```

## Development vs Production

### Development (Local)

For local development, you can still run the services directly:

```bash
# Terminal 1: Server
cd server
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Production (Docker)

Use Docker Compose for production deployments:

```bash
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

If you get a port conflict error, change the ports in `.env`:

```env
SERVER_PORT=8001
FRONTEND_PORT=5174
```

### Cannot Find Scripts

Make sure the `scripts` directory is mounted correctly. Check `docker-compose.yml` volumes section.

### API Connection Issues

In Docker, the frontend connects to the backend via the service name `server`. Make sure:
1. Both services are on the same network (`content-generation-network`)
2. The `VITE_API_URL` is set correctly (automatically handled in Docker)

### Data Not Persisting

Ensure the volume mounts in `docker-compose.yml` are correct and the directories exist.

