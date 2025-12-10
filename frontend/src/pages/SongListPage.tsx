import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface SongSummary {
  videoId: string;
  title: string;
  artist: string;
}

const API_URL = 'http://localhost:3001/api';

const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '40px auto',
  padding: '20px',
  fontFamily: 'sans-serif',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
};

const listItemStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid #eee',
};

const SongListPage: React.FC = () => {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${API_URL}/songs`);
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        const data = await response.json();
        setSongs(data);
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to fetch songs: ${e.message}. Is the backend server running?`);
        } else {
            setError('An unknown error occurred.');
        }
        console.error('Failed to fetch songs:', e);
      }
    };

    fetchSongs();
  }, []);

  if (error) {
    return <div style={containerStyle}><h1>Error</h1><p>{error}</p></div>;
  }

  return (
    <div style={containerStyle}>
      <h1>Easy Song</h1>
      <h2>Choose a song to learn:</h2>
      <ul style={listStyle}>
        {songs.map(song => (
          <li key={song.videoId} style={listItemStyle}>
            <Link to={`/songs/${song.videoId}`}>
              <strong>{song.title}</strong> by {song.artist}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongListPage;
