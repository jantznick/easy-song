import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import JsonViewer from '../components/JsonViewer';

interface FileStatus {
  raw: boolean;
  transcribed: boolean;
  analyzed: boolean;
  translated: boolean;
}

interface SongData {
  type: string;
  data: any;
  fileStatus: FileStatus;
}

export default function SongDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const [songData, setSongData] = useState<SongData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('translated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      loadSongData();
    }
  }, [videoId]);

  const loadSongData = async () => {
    if (!videoId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/song/${videoId}`);
      if (!response.ok) {
        throw new Error('Song not found');
      }
      const data: SongData = await response.json();
      setSongData(data);
      
      // Set active tab to the first available file type (left to right: raw -> transcribed -> analyzed -> translated)
      if (data.fileStatus.raw) setActiveTab('raw');
      else if (data.fileStatus.transcribed) setActiveTab('transcribed');
      else if (data.fileStatus.analyzed) setActiveTab('analyzed');
      else if (data.fileStatus.translated) setActiveTab('translated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load song');
    } finally {
      setLoading(false);
    }
  };

  const loadFileData = async (fileType: string) => {
    if (!videoId) return;
    
    try {
      const response = await fetch(`/api/song/${videoId}/${fileType}`);
      if (!response.ok) {
        throw new Error(`File not found: ${fileType}`);
      }
      const data = await response.json();
      
      // Update the current tab's data
      if (songData) {
        setSongData({
          ...songData,
          type: fileType,
          data,
        });
      }
    } catch (err) {
      console.error(`Error loading ${fileType}:`, err);
    }
  };

  useEffect(() => {
    if (activeTab && songData?.fileStatus[activeTab as keyof FileStatus]) {
      loadFileData(activeTab);
    }
  }, [activeTab, videoId]);

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !songData) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8 text-red-600">{error || 'Song not found'}</div>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'raw', label: 'Raw Lyrics', available: songData.fileStatus.raw },
    { id: 'transcribed', label: 'Transcribed', available: songData.fileStatus.transcribed },
    { id: 'analyzed', label: 'Analyzed', available: songData.fileStatus.analyzed },
    { id: 'translated', label: 'Translated', available: songData.fileStatus.translated },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Song Details</h1>
          <p className="text-gray-600 mb-4">
            Video ID: <span className="font-mono text-sm">{videoId}</span>
          </p>

          <div className="mb-6">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Open on YouTube ↗
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* YouTube Video */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Video</h2>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* File Tabs */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Data Files</h2>
              
              {/* Tabs */}
              <div className="flex space-x-2 mb-4 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => tab.available && setActiveTab(tab.id)}
                    disabled={!tab.available}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : tab.available
                        ? 'text-gray-600 hover:text-gray-800'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {tab.label}
                    {tab.available && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <JsonViewer data={songData.data} />
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => {
                    const jsonText = JSON.stringify(songData.data, null, 2);
                    navigator.clipboard.writeText(jsonText);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

