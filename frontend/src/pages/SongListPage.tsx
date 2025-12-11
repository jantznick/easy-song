import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SongSummary } from '../types/song';
import { fetchSongs } from '../utils/api';
import SongListItem from '../components/SongListItem';
import StatusDisplay from '../components/StatusDisplay';

const SongListPage: FC = () => {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    getSongs();
  }, []);

  if (isLoading || error) {
    return <StatusDisplay loading={isLoading} error={error} />;
  }

  return (
    <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <header className="text-center mb-16 sm:mb-20">
                <div className="inline-block mb-4">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                    Easy Song
                  </h1>
                </div>
                <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-text-secondary max-w-2xl mx-auto">
                  Choose a song to begin your learning journey
                </p>
                <div className="mt-8 flex items-center justify-center gap-2 text-text-muted">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
                </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {songs.map(song => (
                    <SongListItem key={song.videoId} song={song} />
                ))}
            </div>
        </div>
    </main>
  );
};

export default SongListPage;

