import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import YouTube from 'react-youtube';

// The YouTubePlayer type is not a named export, so we define what we need.
interface YouTubePlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}

// --- Type Definitions ---
interface LyricLine {
  spanish: string;
  english: string | null;
  explanation: string | null;
  start_ms: number;
  end_ms: number;
}

interface SongSection {
  title: string;
  lines: LyricLine[];
}

interface Song {
  videoId: string;
  title: string;
  artist: string;
  sections: SongSection[];
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

const playerContainerStyle: React.CSSProperties = {
  position: 'relative',
  paddingBottom: '56.25%', // 16:9 aspect ratio
  height: 0,
  overflow: 'hidden',
  maxWidth: '100%',
  background: '#000',
  marginBottom: '20px',
};

const SongPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Flatten all lines from all sections for easier processing
  const allLines = useMemo(() => {
    if (!song) return [];
    return song.sections.flatMap(section => section.lines);
  }, [song]);

  useEffect(() => {
    if (!videoId) return;

    const fetchSong = async () => {
      try {
        const response = await fetch(`${API_URL}/songs/${videoId}`);
        if (!response.ok) {
          throw new Error(`Song not found or network error (${response.status})`);
        }
        const data = await response.json();
        setSong(data);
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to fetch song: ${e.message}.`);
        } else {
            setError('An unknown error occurred.');
        }
        console.error('Failed to fetch song:', e);
      }
    };

    fetchSong();

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  // Effect to scroll to the active line when it changes
  useEffect(() => {
    if (activeLineIndex !== null && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // Changed from 'center' to 'start'
      });
    }
  }, [activeLineIndex]);


  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: { data: number }) => {
    // When video starts playing
    if (event.data === 1) { // 1 = playing
      intervalRef.current = setInterval(() => {
        if (!playerRef.current) return;

        const currentTimeMs = playerRef.current.getCurrentTime() * 1000;
        
        // Find the index of the current line
        let currentLineIndex = -1;
        for(let i = 0; i < allLines.length; i++) {
            if (currentTimeMs >= allLines[i].start_ms && currentTimeMs <= allLines[i].end_ms) {
                currentLineIndex = i;
                break;
            }
        }
        
        if (currentLineIndex !== -1) {
            setActiveLineIndex(currentLineIndex);
        }

      }, 250); // Check every 250ms
    } else { // When video is paused, stopped, etc.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  if (error) {
    return <div style={containerStyle}><h1>Error</h1><p>{error}</p></div>;
  }

  if (!song) {
    return <div style={containerStyle}>Loading...</div>;
  }

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0, // Set to 0 to prevent autoplay on load
    },
  };

  return (
    <div style={containerStyle}>
      <Link to="/">&larr; Back to Song List</Link>
      <h1>{song.title}</h1>
      <p style={{ marginTop: 0, color: '#666' }}>by {song.artist}</p>
      <div style={playerContainerStyle}>
        <YouTube 
          videoId={song.videoId} 
          opts={opts} 
          className="youtube-player"
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      </div>

      <div className="lyrics-container">
        <ul className="lyrics-list">
          {allLines.map((line, index) => (
            <li
              key={index}
              ref={el => lineRefs.current[index] = el}
              className={`lyric-line ${activeLineIndex === index ? 'active' : ''}`}
              onClick={() => {
                if(playerRef.current) {
                  playerRef.current.seekTo(line.start_ms / 1000, true);
                }
              }}
            >
              {line.spanish}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SongPlayerPage;
