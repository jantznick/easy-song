import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SongSummary } from '../types/song';
import { fetchSongs } from '../utils/api';

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
  display: 'flex',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #eee',
};

const thumbnailStyle: React.CSSProperties = {
    width: '120px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginRight: '20px',
};

const songInfoStyle: React.CSSProperties = {
    flexGrow: 1,
};

const SongListPage: React.FC = () => {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSongs = async () => {
      try {
        const data = await fetchSongs();
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

    getSongs();
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
            <Link to={`/songs/${song.videoId}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <img src={song.thumbnailUrl} alt={song.title} style={thumbnailStyle} />
              <div style={songInfoStyle}>
                <strong>{song.title}</strong>
                <p style={{ margin: '4px 0 0', color: '#666' }}>by {song.artist}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongListPage;

