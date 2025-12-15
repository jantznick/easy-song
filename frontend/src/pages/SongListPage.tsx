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
  const [modalImage, setModalImage] = useState<string | null>(null);

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

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) {
        setModalImage(null);
      }
    };

    if (modalImage) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [modalImage]);

  if (isLoading || error) {
    return <StatusDisplay loading={isLoading} error={error} />;
  }

  return (
    <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            {/* Songs Grid */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Available Songs</h2>
              <p className="text-text-secondary mb-8">Choose a song to start learning</p>
            </div>
            
            {songs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block mb-4 p-4 rounded-full bg-surface border border-border">
                  <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-lg text-text-secondary">No songs available yet</p>
                <p className="text-sm text-text-muted mt-2">Check back soon for new content!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {songs.map(song => (
                      <SongListItem key={song.videoId} song={song} />
                  ))}
              </div>
            )}
        </div>
    </main>
  );
};

export default SongListPage;

