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
            {/* Hero Section */}
            <header className="text-center mb-16 sm:mb-24">
                <div className="inline-block mb-6">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                    Easy Song
                  </h1>
                </div>
                <p className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary max-w-3xl mx-auto leading-tight">
                  Learn Languages Through Music
                </p>
                <p className="mt-6 text-lg sm:text-xl leading-relaxed text-text-secondary max-w-2xl mx-auto">
                  Master foreign languages by learning through your favorite songs. Interactive lyrics, real-time translations, and detailed explanations help you understand meaning, slang, and cultural context.
                </p>
            </header>

            {/* Visual Showcase */}
            <div className="mb-16 sm:mb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
                {/* Play Along Mode */}
                <div className="space-y-4">
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Play Along Mode</h3>
                    <p className="text-text-secondary">
                      Watch videos with synchronized, scrolling lyrics that highlight in real-time as you listen. Perfect for following along and getting the rhythm of the language.
                    </p>
                  </div>
                  <div className="hidden lg:block rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10">
                    <img 
                      src="/play-along.png" 
                      alt="Play Along Mode - Desktop view showing synchronized lyrics with video"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setModalImage('/play-along.png')}
                    />
                  </div>
                </div>

                {/* Study Mode */}
                <div className="space-y-4">
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Study Mode</h3>
                    <p className="text-text-secondary">
                      Deep dive into lyrics with line-by-line explanations, cultural context, and section breakdowns. Understand the meaning behind every word.
                    </p>
                  </div>
                  <div className="hidden lg:block rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-secondary/10">
                    <img 
                      src="/study-mode.png" 
                      alt="Study Mode - Desktop view showing detailed explanations and section breakdowns"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setModalImage('/study-mode.png')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Modal */}
            {modalImage && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setModalImage(null)}
              >
                <div className="relative max-w-7xl max-h-[90vh] w-full">
                  <button
                    onClick={() => setModalImage(null)}
                    className="absolute -top-12 right-0 text-white hover:text-text-secondary transition-colors p-2"
                    aria-label="Close modal"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img 
                    src={modalImage} 
                    alt="Full size preview"
                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-16 sm:mb-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
                <div className="p-6 rounded-xl bg-surface/50 border border-border/50 hover:border-primary/30 transition-all duration-200">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">Synchronized Lyrics</h3>
                  <p className="text-sm text-text-secondary leading-relaxed text-center">
                    Lyrics scroll and highlight automatically as the song plays, keeping you perfectly in sync.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-surface/50 border border-border/50 hover:border-primary/30 transition-all duration-200">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">Deep Learning</h3>
                  <p className="text-sm text-text-secondary leading-relaxed text-center">
                    Get detailed explanations for every line, including cultural context and idiomatic expressions.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-surface/50 border border-border/50 hover:border-primary/30 transition-all duration-200">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">Real Translations</h3>
                  <p className="text-sm text-text-secondary leading-relaxed text-center">
                    Accurate translations that capture slang, idioms, and cultural nuances, not just literal meanings.
                  </p>
                </div>
              </div>
            </div>
            
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

