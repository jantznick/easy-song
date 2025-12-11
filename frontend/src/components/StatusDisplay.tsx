import type { FC } from 'react';

interface StatusDisplayProps {
  error?: string | null;
  loading?: boolean;
  loadingText?: string;
}

const StatusDisplay: FC<StatusDisplayProps> = ({ error, loading, loadingText = "Loading..." }) => {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <div className="p-8 lg:p-10">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">An Error Occurred</h1>
            <p className="text-text-secondary break-words leading-relaxed">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block mb-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-text-secondary text-xl font-medium">{loadingText}</p>
            </div>
        </div>
    );
  }

  return null;
};

export default StatusDisplay;
