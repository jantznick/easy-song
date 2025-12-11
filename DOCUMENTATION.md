# Easy Song - Project Documentation

This document provides a detailed overview of the Easy Song application's architecture, data pipeline, and planned features.

## 1. Project Overview

Easy Song is a language-learning application designed to help users learn languages through music. The core concept is to provide an immersive experience where users can watch a music video, follow along with synchronized lyrics, and get detailed, line-by-line explanations of the meaning, slang, and cultural context.

## 2. Architecture

The project is structured as a monorepo with two distinct parts: a `frontend` and a `backend`.

### `/backend`

The backend is a Node.js application built with TypeScript and Express.js. Its responsibilities are twofold:

1.  **Data Generation:** It contains the scripts necessary to generate the core content of the app.
2.  **API Server:** It runs a simple server to provide the generated data to the frontend.

Key components:
*   `data/`: This directory is the "database" of the application.
    *   `raw-lyrics/`: Stores intermediate files containing structured lyrics with timestamps, fetched directly from YouTube.
    *   `songs/`: Stores the final, complete song lesson files in JSON format.
*   `scripts/`: Contains the data generation pipeline.
    *   `fetch-lyrics.ts`: Fetches a video's transcript from YouTube and saves it as a structured file with timestamps.
    *   `generate-analysis.ts`: Takes the raw lyrics, uses the OpenAI API to generate translations and explanations, and merges the two data sources into a final song file.
*   `src/index.ts`: A simple Express.js server that exposes the contents of `data/songs/` through a REST API.

### `/frontend`

The frontend is a modern web application built with Vite, React, and TypeScript. It is responsible for all user-facing views and interactions.

Key components:
*   `src/pages/`: Contains the main page components.
    *   `SongListPage.tsx`: The home page, which fetches and displays a list of all available songs from the backend API.
    *   `SongPlayerPage.tsx`: The core experience page. It displays the YouTube player and the synchronized, scrolling lyrics.

## 3. Application Modes (The User Journey)

This outlines the planned features for the user's learning journey, broken down into distinct "modes".

### Mode 1: Discovery (Implemented)

*   **Goal:** The user browses and selects a song.
*   **Flow:** The user opens the app to a library of songs, filterable by artist, genre, or difficulty. They select a song to begin.
*   **Current Status:** A basic song list is implemented.

### Mode 2: Karaoke (Implemented)

*   **Goal:** The user gets an initial feel for the song by listening and following the lyrics.
*   **Flow:** The YouTube music video plays. Below it, the lyrics appear and are highlighted line-by-line in sync with the music. The user can optionally toggle a direct English translation.
*   **Current Status:** The video player and synchronized, scrolling Spanish lyrics are implemented.

### Mode 3: Study (Not Implemented)

*   **Goal:** The user does a deep dive into the meaning of the lyrics.
*   **Flow:** After the song, the app presents a breakdown of the lyrics by section (Verse, Chorus). For each line, the user sees the Spanish lyric, the English translation, and the detailed explanation. They can click to play just that audio snippet.

### Mode 4: Practice (Not Implemented)

*   **Goal:** The user tests their knowledge to reinforce learning.
*   **Flow:** This could involve light gamification, such as "fill in the blanks" for missing words in the lyrics or multiple-choice questions about a phrase's meaning.

### Mode 5: Mastery (Not Implemented)

*   **Goal:** The user listens to the song again with their new knowledge.
*   **Flow:** The music video plays again, but now the user has full control over showing or hiding the lyrics and translations, aiming for comprehension without assistance.
