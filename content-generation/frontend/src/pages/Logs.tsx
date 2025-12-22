import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Logs() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lines, setLines] = useState(100);
  const [totalLines, setTotalLines] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/logs?lines=${lines}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.message || data.error);
        setLogs('');
      } else {
        setLogs(data.logs || '');
        setTotalLines(data.totalLines || 0);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
      setLogs('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [lines]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, lines]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Process Logs</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs sm:text-sm text-gray-700">Auto-refresh</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-700">Lines:</label>
                <select
                  value={lines}
                  onChange={(e) => setLines(parseInt(e.target.value, 10))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
              </div>
              <button
                onClick={loadLogs}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {totalLines > 0 && (
            <div className="mb-2 text-sm text-gray-600">
              Showing last {lines} of {totalLines} total lines
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-medium">Error loading logs:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-2 sm:p-4 overflow-auto max-h-[50vh] sm:max-h-[70vh]">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
                {logs || 'No logs available yet. Logs will appear here once processing starts.'}
              </pre>
              <div ref={logEndRef} />
            </div>
          )}

          <div className="mt-4 text-xs sm:text-sm text-gray-600">
            <p className="break-words">Log file location: <code className="bg-gray-100 px-1 sm:px-2 py-1 rounded text-xs">content-generation/logs/process.log</code></p>
            <p className="mt-2 break-words">In Docker: <code className="bg-gray-100 px-1 sm:px-2 py-1 rounded text-xs">./logs/process.log</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

