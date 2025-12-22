# Content Generation Server & Frontend

This directory contains a Node/Express server and React frontend for managing the content generation pipeline.

## Structure

- `server/` - Express API server (TypeScript)
- `frontend/` - React + Vite frontend (TypeScript)
- `scripts/` - Content generation scripts (download, analyze, translate)
- `data/` - Generated content files

## Setup

### Server

```bash
cd server
npm install
npm run dev  # Development mode with hot reload
# or
npm run build && npm start  # Production mode
```

The server runs on `http://localhost:8000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev  # Development mode (runs on port 5173, proxies API to 8000)
# or
npm run build  # Production build
```

## Development Workflow

1. Start the server:
   ```bash
   cd server && npm run dev
   ```

2. In another terminal, start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## API Endpoints

- `GET /api/songs` - Get all songs with metadata
- `GET /api/song/:videoId` - Get song data (returns best available file)
- `GET /api/song/:videoId/:fileType` - Get specific file type (raw, transcribed, analyzed, translated)
- `POST /api/process` - Process new YouTube videos

## Features

- **Main Page**: Shows all existing songs with YouTube URL and title
- **Song Detail Page**: Tabbed interface to view all intermediate files (raw, transcribed, analyzed, translated)
- **Video Processing**: Submit YouTube URLs to start the full pipeline

