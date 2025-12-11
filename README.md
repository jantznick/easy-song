# Easy Song

Easy Song is a web application for learning languages through music. It provides an immersive experience where users can watch music videos with synchronized, interactive lyrics and get detailed explanations of the meaning, slang, and cultural context.

## Project Structure

This project is a monorepo containing two main packages:

*   `/frontend`: A Vite + React + TypeScript single-page application that provides the user interface.
*   `/backend`: A Node.js + Express + TypeScript server that handles data generation and serves the song content via a REST API.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm
*   An OpenAI API Key

### 1. Backend Setup

First, set up and run the backend server.

1.  **Navigate to the backend:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the `backend` directory and add your OpenAI API key:
    ```
    OPENAI_API_KEY=sk-YourSecretKeyGoesHere
    ```

4.  **Generate Song Data:**
    Run the data pipeline scripts for a YouTube video ID. This is a two-step process.
    ```bash
    # Step 1: Fetch the raw, timestamped lyrics
    npx ts-node scripts/fetch-lyrics.ts <YOUTUBE_VIDEO_ID>

    # Step 2: Generate the AI analysis and final song file
    npx ts-node scripts/generate-analysis.ts <YOUTUBE_VIDEO_ID>
    ```

5.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3001`.

### 2. Frontend Setup

Next, set up and run the frontend application in a separate terminal.

1.  **Navigate to the frontend:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend dev server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

For deploying to production, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Deploying to Render as a static site
- Setting up Backblaze B2 for data file hosting
- Configuring CORS and environment variables

## Static File Hosting (S3/Cloudflare R2/etc.)

Instead of running a backend API server, you can host your song data files in S3, Cloudflare R2, or any static file hosting service. This eliminates the need for a backend server.

### Setup Steps

1. **Generate the songs list file:**
   ```bash
   cd backend
   npm run generate-songs-list
   ```
   This creates `backend/data/songs-list.json` containing summaries of all songs.

2. **Upload files to your storage service:**
   
   Upload your files **at the root level** of your bucket with this structure:
   ```
   your-bucket/                  (root of bucket)
   ├── songs-list.json          # Generated list of all songs
   ├── songs/                   # Folder at root level
   │   ├── {videoId1}.json
   │   ├── {videoId2}.json
   │   └── ...
   └── study/                   # Folder at root level
       ├── {videoId1}.json      # Optional study data
       ├── {videoId2}.json
       └── ...
   ```
   
   **Note:** The `songs/` and `study/` folders go directly at the bucket root, not inside a `data/` folder.

3. **Configure the frontend:**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_MODE=static
   VITE_STATIC_BASE_URL=https://your-bucket.s3.amazonaws.com
   ```
   
   Or for Cloudflare R2 with a custom domain:
   ```env
   VITE_API_MODE=static
   VITE_STATIC_BASE_URL=https://cdn.yourdomain.com
   ```

4. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

### Notes

- The `songs-list.json` file must be regenerated whenever you add or remove songs.
- Study data files are optional - if a study file doesn't exist for a song, Study mode will gracefully handle it.
- Make sure your storage service allows CORS requests from your frontend domain.
- For S3, you may need to set appropriate CORS headers on your bucket.
