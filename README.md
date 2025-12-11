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
