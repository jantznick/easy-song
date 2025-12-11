import { useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import YouTube from 'react-youtube';
import type { Song } from '../types/song';
import { fetchSongById } from '../utils/api';
import Card from '../components/Card';
import StatusDisplay from '../components/StatusDisplay';

// The YouTubePlayer type is not a named export, so we define what we need.
interface YouTubePlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
}

const SongPlayerPage: FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [showTranslations, setShowTranslations] = useState<boolean>(false);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);
  const intervalRef = useRef<number | null>(null);
  
  const allLines = useMemo(() => {
    if (!song) return [];
    return song.sections.flatMap(section => section.lines);
  }, [song]);

  useEffect(() => {
    if (!videoId) return;

    const getSong = async () => {
      if (!videoId) return;
      try {
        const data = await fetchSongById(videoId);
        setSong(data);
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to fetch song: ${e.message}`);
        } else {
            setError('An unknown error occurred.');
        }
        console.error('Failed to fetch song:', e);
      }
    };

    getSong();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (activeLineIndex === null) return;

    const activeLineEl = lineRefs.current[activeLineIndex];
    const containerEl = lyricsContainerRef.current;

    if (activeLineEl && containerEl) {
      // Calculate position relative to the scrollable container
      const lineRect = activeLineEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      
      // Calculate how much we need to scroll within the container
      const scrollTop = containerEl.scrollTop;
      const lineOffsetFromContainerTop = lineRect.top - containerRect.top + scrollTop;
      
      // Scroll the container (not the whole page) to position the line at the top
      containerEl.scrollTo({
        top: lineOffsetFromContainerTop - 16, // 16px padding from top
        behavior: 'smooth'
      });
    }
  }, [activeLineIndex]);


  const onPlayerReady = (event: { target: any }) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: { data: number }) => {
    if (event.data === 1) { // playing
      intervalRef.current = setInterval(() => {
        if (!playerRef.current) return;
        const currentTimeMs = playerRef.current.getCurrentTime() * 1000;
        const currentLineIndex = allLines.findIndex(line => currentTimeMs >= line.start_ms && currentTimeMs <= line.end_ms);
        
        if (currentLineIndex !== -1) {
            setActiveLineIndex(currentLineIndex);
        }
      }, 250);
    } else { // paused, ended, etc.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  if (error || !song) {
    return <StatusDisplay loading={!song} error={error} loadingText="Loading song..." />;
  }

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: { autoplay: 0 },
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors duration-200 group font-medium"
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Song List</span>
              </Link>
              <Link
                to={`/songs/${song.videoId}/study`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors duration-200 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Study Mode</span>
              </Link>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight">{song.title}</h1>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column: Video Player */}
            <div className="lg:col-span-3">
                <Card className="overflow-hidden">
                    <div className="aspect-video w-full bg-background-secondary rounded-xl overflow-hidden">
                        <YouTube 
                            videoId={song.videoId} 
                            opts={opts} 
                            className="w-full h-full"
                            onReady={onPlayerReady}
                            onStateChange={onPlayerStateChange}
                        />
                    </div>
                </Card>
            </div>

            {/* Right Column: Lyrics */}
            <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Play Along Mode
                          </h2>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200">
                              Show Translation
                            </span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={showTranslations}
                                onChange={(e) => setShowTranslations(e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                                showTranslations ? 'bg-primary' : 'bg-surface-hover'
                              }`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 transform ${
                                  showTranslations ? 'translate-x-7' : 'translate-x-0'
                                }`} />
                              </div>
                            </div>
                          </label>
                        </div>
                    </div>
                    <div className="max-h-[75vh] overflow-y-auto p-4 lg:p-6" ref={lyricsContainerRef}>
                        <ul className="space-y-3 list-none">
                        {allLines.map((line, index) => (
                            <li
                            key={index}
                            ref={el => { lineRefs.current[index] = el; }}
                            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 text-lg leading-relaxed ${
                                activeLineIndex === index 
                                ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-lg shadow-primary/10 border-l-4 border-primary transform scale-[1.02]' 
                                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border-l-4 border-transparent'
                            }`}
                            onClick={() => {
                                if(playerRef.current) {
                                playerRef.current.seekTo(line.start_ms / 1000, true);
                                playerRef.current.playVideo();
                                }
                            }}
                            >
                            <div className="flex flex-col gap-1">
                              <span>{line.spanish}</span>
                              {showTranslations && line.english && (
                                <span className="text-sm text-text-muted italic mt-1">
                                  {line.english}
                                </span>
                              )}
                            </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
};

export default SongPlayerPage;
