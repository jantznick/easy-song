import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Notification from '../components/Notification';

interface FileStatus {
  raw: boolean;
  transcribed: boolean;
  analyzed: boolean;
  translated: boolean;
}

interface Song {
  videoId: string;
  title?: string;
  artist?: string;
  url: string;
  fileStatus?: FileStatus;
}

export default function Home() {
  const [urls, setUrls] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ type: string; message: string; data?: any } | null>(null);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (urlList.length === 0) {
      setResult({ type: 'error', message: 'Please enter at least one URL or video ID' });
      return;
    }

    setLoading(true);
    setStatus('');
    setResult(null);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: data.skipped ? 'info' : 'success',
          message: data.message || 'Processing started',
          data,
        });
        setUrls('');
        setTimeout(loadSongs, 2000);
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to process videos' });
      }
    } catch (error) {
      setResult({ type: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const checkExisting = () => {
    const urlList = urls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (urlList.length === 0) {
      setStatus('');
      return;
    }

    const existing = urlList.filter(url => {
      const videoId = extractVideoId(url);
      return videoId && songs.some(s => s.videoId === videoId);
    });

    if (existing.length > 0) {
      setStatus(`⚠️ ${existing.length} video(s) already exist (will be skipped)`);
    } else {
      setStatus('');
    }
  };

  useEffect(() => {
    checkExisting();
  }, [urls, songs]);

  const handleAnalyze = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setProcessing(prev => new Set(prev).add(videoId));
    
    try {
      const response = await fetch(`/api/analyze/${videoId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.alreadyExists) {
          setNotification({ message: 'Song is already analyzed', type: 'info' });
        } else {
          setNotification({ message: 'Analysis started! Translation will follow automatically.', type: 'success' });
          setTimeout(loadSongs, 2000);
        }
      } else {
        setNotification({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  };

  const handleTranslate = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setProcessing(prev => new Set(prev).add(videoId));
    
    try {
      const response = await fetch(`/api/translate/${videoId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.alreadyExists) {
          setNotification({ message: 'Song is already translated', type: 'info' });
        } else {
          setNotification({ message: 'Translation started!', type: 'success' });
          setTimeout(loadSongs, 2000);
        }
      } else {
        setNotification({ message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">YouTube Video Processor</h1>
          <p className="text-gray-600 mb-6">Enter YouTube URLs or video IDs (one per line) to process them</p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
                URLs or Video IDs
              </label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID&#10;https://youtu.be/VIDEO_ID&#10;VIDEO_ID"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Process Videos'}
              </button>
              <button
                type="button"
                onClick={loadSongs}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Refresh List
              </button>
              <Link
                to="/logs"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
              >
                View Logs
              </Link>
              {status && <div className="text-sm text-yellow-600">{status}</div>}
            </div>
          </form>

          {result && (
            <div
              className={`mb-6 border rounded-lg p-4 ${
                result.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : result.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <p className="font-medium mb-2">{result.message}</p>
              {result.data?.existing && (
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-1">
                    Already Existing: {Object.values(result.data.existing).flat().length}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {Object.entries(result.data.existing).map(([key, ids]: [string, any]) =>
                      Array.isArray(ids) && ids.length > 0 ? (
                        <li key={key} className="font-mono text-xs">
                          {ids.join(', ')} ({key})
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Existing Songs</h2>
          {songs.length > 0 ? (
            <div className="space-y-2">
              {songs.map((song) => {
                const status = song.fileStatus;
                const needsAnalyze = status && !status.analyzed && status.transcribed;
                const needsTranslate = status && !status.translated && status.analyzed;
                const isProcessing = processing.has(song.videoId);
                
                return (
                  <div
                    key={song.videoId}
                    className="block bg-gray-50 border border-gray-200 rounded px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/song/${song.videoId}`}
                        className="flex-1"
                      >
                        <div>
                          <div className="font-mono text-sm text-blue-600 hover:text-blue-800">
                            {song.url}
                          </div>
                          {song.title && (
                            <div className="text-sm text-gray-600 mt-1">
                              {song.title} {song.artist && `- ${song.artist}`}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-xs text-gray-500">{song.videoId}</div>
                        {needsAnalyze && (
                          <button
                            onClick={(e) => handleAnalyze(song.videoId, e)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Analyze song (will auto-translate after)"
                          >
                            {isProcessing ? 'Processing...' : 'Analyze'}
                          </button>
                        )}
                        {needsTranslate && (
                          <button
                            onClick={(e) => handleTranslate(song.videoId, e)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Translate song"
                          >
                            {isProcessing ? 'Processing...' : 'Translate'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-sm text-gray-500 mt-4">Total: {songs.length} song(s)</p>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">No songs found</div>
          )}
        </div>
      </div>
    </div>
  );
}

