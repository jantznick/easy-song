import { useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import YouTube from 'react-youtube';
import type { Song, StudyData, StructuredSection } from '../types/song';
import { fetchSongById, fetchStudyData } from '../utils/api';
import Card from '../components/Card';
import StatusDisplay from '../components/StatusDisplay';

// The YouTubePlayer type is not a named export, so we define what we need.
interface YouTubePlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
}

const SongStudyPage: FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [playingSection, setPlayingSection] = useState<number | null>(null);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(false);
  const [playbackTimeouts, setPlaybackTimeouts] = useState<ReturnType<typeof setTimeout>[]>([]);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get all lines from original song for gap detection
  const allOriginalLines = useMemo(() => {
    if (!song) return [];
    return song.sections.flatMap(section => section.lines);
  }, [song]);

  // Get all covered time ranges from structured sections
  const coveredTimeRanges = useMemo(() => {
    if (!studyData) return [];
    const ranges: Array<{ start: number; end: number }> = [];
    studyData.structuredSections.forEach(section => {
      section.lines.forEach(line => {
        ranges.push({ start: line.start_ms, end: line.end_ms });
      });
    });
    return ranges;
  }, [studyData]);

  // Find lines not covered by structured sections
  const additionalContent = useMemo(() => {
    if (!studyData || allOriginalLines.length === 0) return [];
    
    return allOriginalLines.filter(line => {
      // Check if this line's time range overlaps with any covered range
      return !coveredTimeRanges.some(range => {
        // Line is covered if it overlaps with a covered range
        return (line.start_ms >= range.start && line.start_ms <= range.end) ||
               (line.end_ms >= range.start && line.end_ms <= range.end) ||
               (line.start_ms <= range.start && line.end_ms >= range.end);
      });
    });
  }, [studyData, allOriginalLines, coveredTimeRanges]);

  useEffect(() => {
    if (!videoId) return;

    const loadData = async () => {
      try {
        // Fetch both song and study data in parallel
        const [songData, studyDataResult] = await Promise.all([
          fetchSongById(videoId),
          fetchStudyData(videoId).catch(() => null), // Gracefully handle missing study data
        ]);
        
        setSong(songData);
        setStudyData(studyDataResult);
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch data: ${e.message}`);
        } else {
          setError('An unknown error occurred.');
        }
        console.error('Failed to fetch data:', e);
      }
    };

    loadData();
  }, [videoId]);

  // Expand first section by default when study data loads
  useEffect(() => {
    if (studyData && studyData.structuredSections.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([0]));
      // Auto-expand explanations by default
      setExpandedExplanations(new Set([0]));
    }
  }, [studyData, expandedSections.size]);

  const onPlayerReady = (event: { target: any }) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: { data: number }) => {
    // Track player state: 1 = playing, 2 = paused, 0 = ended
    setIsPlayerPlaying(event.data === 1);
    
    if (event.data === 1) { // playing
      // Start checking current time and scrolling to active line
      intervalRef.current = setInterval(() => {
        if (!playerRef.current || !studyData) return;
        
        const currentTimeMs = playerRef.current.getCurrentTime() * 1000;
        
        // Find which line is currently playing across all sections
        let foundLineIndex: number | null = null;
        let foundSectionIndex: number | null = null;
        
        studyData.structuredSections.forEach((section, sectionIdx) => {
          section.lines.forEach((line, lineIdx) => {
            if (currentTimeMs >= line.start_ms && currentTimeMs <= line.end_ms) {
              foundLineIndex = lineIdx;
              foundSectionIndex = sectionIdx;
            }
          });
        });
        
        if (foundLineIndex !== null && foundSectionIndex !== null) {
          // Only update if it's a different line to avoid constant re-renders
          const lineChanged = activeLineIndex !== foundLineIndex || activeSectionIndex !== foundSectionIndex || !expandedSections.has(foundSectionIndex);
          if (lineChanged) {
            setActiveLineIndex(foundLineIndex);
            setActiveSectionIndex(foundSectionIndex);
            
            // Make sure the section is expanded
            if (foundSectionIndex !== null && !expandedSections.has(foundSectionIndex)) {
              const sectionIdx = foundSectionIndex; // Type narrowing
              setExpandedSections(new Set([sectionIdx]));
              setExpandedExplanations(prev => {
                const newSet = new Set(prev);
                newSet.add(sectionIdx);
                return newSet;
              });
            }
          }
          
          // Scroll will be handled by useEffect when activeLineIndex changes
        }
      }, 250);
    } else { // paused, ended, etc.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear playing section when paused or ended
      if (event.data === 2 || event.data === 0) { // paused or ended
        setPlayingSection(null);
      }
    }
  };

  // Scroll to active line when it changes
  useEffect(() => {
    if (activeLineIndex === null || activeSectionIndex === null) return;

    const lineKey = `${activeSectionIndex}-${activeLineIndex}`;
    const lineElement = lineRefs.current.get(lineKey);
    const containerElement = contentContainerRef.current;

    if (lineElement && containerElement) {
      // Use setTimeout to ensure DOM is updated after state changes
      setTimeout(() => {
        // Calculate position relative to the scrollable container using getBoundingClientRect
        const lineRect = lineElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        
        // Calculate how much we need to scroll within the container
        const scrollTop = containerElement.scrollTop;
        const lineOffsetFromContainerTop = lineRect.top - containerRect.top + scrollTop;
        
        // Scroll to position the line at the top of the container
        const targetScrollTop = lineOffsetFromContainerTop - 16; // 16px padding from top
        
        containerElement.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [activeLineIndex, activeSectionIndex]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);


  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      playbackTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [playbackTimeouts]);

  const playLine = (startMs: number, endMs: number, sectionIndex?: number) => {
    if (!playerRef.current) return;
    
    // Clear any existing timeouts
    playbackTimeouts.forEach(timeout => clearTimeout(timeout));
    setPlaybackTimeouts([]);
    
    playerRef.current.seekTo(startMs / 1000, true);
    playerRef.current.playVideo();
    
    // Auto-pause at end_ms
    const duration = (endMs - startMs) / 1000;
    const timeout = setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      if (sectionIndex !== undefined) {
        setPlayingSection(null);
      }
    }, duration * 1000);
    
    setPlaybackTimeouts([timeout]);
  };

  const playSection = async (section: StructuredSection, sectionIndex: number) => {
    if (!playerRef.current || section.lines.length === 0) return;
    
    // If already playing this section, pause instead
    if (playingSection === sectionIndex && isPlayerPlaying) {
      playerRef.current.pauseVideo();
      return;
    }
    
    // Clear any existing timeouts and intervals
    playbackTimeouts.forEach(timeout => clearTimeout(timeout));
    setPlaybackTimeouts([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setPlayingSection(sectionIndex);
    setActiveLineIndex(null);
    setActiveSectionIndex(null);
    
    // Simply seek to start and play - the onPlayerStateChange handler will handle scrolling
    playerRef.current.seekTo(section.lines[0].start_ms / 1000, true);
    playerRef.current.playVideo();
    
    // Mark section as completed when we reach the end of the last line
    const lastLine = section.lines[section.lines.length - 1];
    const totalDuration = (lastLine.end_ms - section.lines[0].start_ms) / 1000;
    
    const completeTimeout = setTimeout(() => {
      setCompletedSections(prev => new Set([...prev, sectionIndex]));
      setPlayingSection(null);
      setActiveLineIndex(null);
    setActiveSectionIndex(null);
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, totalDuration * 1000);
    
    setPlaybackTimeouts([completeTimeout]);
  };

  const expandNextSection = (currentSectionIndex: number) => {
    if (!studyData) return;
    const allSections = studyData.structuredSections.length + (additionalContent.length > 0 ? 1 : 0);
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < allSections) {
      // Replace the current section with the next one (don't add to existing)
      setExpandedSections(new Set([nextIndex]));
      // Auto-expand explanation for the next section
      if (nextIndex < studyData.structuredSections.length) {
        setExpandedExplanations(prev => new Set([...prev, nextIndex]));
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

  const sections = studyData?.structuredSections || [];
  const hasStudyData = studyData !== null;

  return (
    <main className="min-h-screen p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-2 sm:mb-4 lg:mb-8">
          <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-6">
            <Link 
              to={`/songs/${videoId}`}
              className="inline-flex items-center gap-1 sm:gap-2 text-text-secondary hover:text-primary transition-colors duration-200 group font-medium text-xs sm:text-sm"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back to Karaoke</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
          <h1 className="text-xs sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-text-primary leading-tight">{song.title}</h1>
          <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-text-secondary mt-0.5 sm:mt-1">{song.artist}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-8">
          {/* Left Column: Video Player - Sticky */}
          <div className="lg:col-span-3 order-1">
            <div className="sticky top-2 sm:top-4 lg:top-8">
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
          </div>

          {/* Right Column: Section Navigation Pills + Content */}
          {hasStudyData ? (
            <div className="lg:col-span-2 flex flex-col order-2">
              {/* Horizontal Scrollable Pills */}
              <div className="overflow-x-auto pb-2 sm:pb-4 mb-2 sm:mb-4 -mx-1 sm:-mx-2 px-1 sm:px-2">
                <div className="flex gap-1.5 sm:gap-2 min-w-max">
                  {sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Only allow one section expanded at a time
                        setExpandedSections(new Set([index]));
                        // Auto-expand explanation for this section
                        setExpandedExplanations(prev => new Set([...prev, index]));
                      }}
                      className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        expandedSections.has(index)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'bg-surface-hover text-text-secondary hover:bg-surface hover:text-text-primary border border-border'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                  {additionalContent.length > 0 && (
                    <button
                      onClick={() => {
                        setExpandedSections(new Set([sections.length]));
                      }}
                      className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        expandedSections.has(sections.length)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'bg-surface-hover text-text-secondary hover:bg-surface hover:text-text-primary border border-border'
                      }`}
                    >
                      Additional Content
                    </button>
                  )}
                </div>
              </div>

              {/* Section Explanation and Buttons - Separate Container */}
              {Array.from(expandedSections).length > 0 && (() => {
                const firstExpandedIndex = Array.from(expandedSections)[0];
                if (firstExpandedIndex < sections.length) {
                  const section = sections[firstExpandedIndex];
                  const isExplanationExpanded = expandedExplanations.has(firstExpandedIndex);
                  return (
                    <Card className="mb-4">
                      <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                        {section.sectionExplanation && (
                          <div className="border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedExplanations);
                                if (newExpanded.has(firstExpandedIndex)) {
                                  newExpanded.delete(firstExpandedIndex);
                                } else {
                                  newExpanded.add(firstExpandedIndex);
                                }
                                setExpandedExplanations(newExpanded);
                              }}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-between"
                            >
                              <span className="text-xs sm:text-sm font-medium text-text-primary">Section Explanation</span>
                              <svg 
                                className={`w-4 h-4 text-primary transition-transform duration-200 ${
                                  isExplanationExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isExplanationExpanded && (
                              <div className="p-3 sm:p-4 border-t border-border">
                                <p className="text-xs sm:text-sm lg:text-base text-text-primary leading-relaxed">{section.sectionExplanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Play All / Pause Button */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => playSection(section, firstExpandedIndex)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
                          >
                            {playingSection === firstExpandedIndex && isPlayerPlaying ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Play All</span>
                              </>
                            )}
                          </button>
                          {completedSections.has(firstExpandedIndex) && (
                            <button
                              onClick={() => expandNextSection(firstExpandedIndex)}
                              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
                            >
                              <span>Next →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Scrollable Lyrics Content */}
              <div 
                ref={contentContainerRef}
                className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-300px)]"
              >
                {Array.from(expandedSections).map((sectionIndex) => {
                  if (sectionIndex < sections.length) {
                    const section = sections[sectionIndex];
                    return (
                      <Card key={sectionIndex} className="overflow-hidden">
                        <div className="p-3 sm:p-4 lg:p-6">
                          <div className="space-y-3 sm:space-y-4">
                            {section.lines.map((line, lineIndex) => {
                              const lineKey = `${sectionIndex}-${lineIndex}`;
                              const isActive = activeLineIndex === lineIndex && playingSection === sectionIndex;
                              return (
                                <div 
                                  key={lineIndex} 
                                  ref={el => { lineRefs.current.set(lineKey, el); }}
                                  className={`border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0 transition-all duration-200 ${
                                    isActive ? 'bg-primary/10 border-primary/30 rounded-lg p-2 sm:p-3 -mx-2 sm:-mx-3' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                                    <button
                                      onClick={() => playLine(line.start_ms, line.end_ms)}
                                      className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 hover:bg-surface-hover rounded-lg transition-colors flex-shrink-0"
                                      title="Play this line"
                                    >
                                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </button>
                                    <div className="flex-1 space-y-1 sm:space-y-2">
                                      <p className={`text-sm sm:text-base lg:text-lg font-medium ${isActive ? 'text-primary' : 'text-text-primary'}`}>{line.spanish}</p>
                                      <p className="text-xs sm:text-sm lg:text-base text-text-secondary italic">{line.english}</p>
                                      {line.explanation && (
                                        <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-1 sm:mt-2">{line.explanation}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    );
                  } else if (sectionIndex === sections.length && additionalContent.length > 0) {
                    return (
                      <Card key={sectionIndex} className="overflow-hidden">
                        <div className="p-3 sm:p-4 lg:p-6">
                          <p className="text-xs sm:text-sm text-text-muted mb-3 sm:mb-4 italic">
                            These lines from the original song weren't included in the structured sections above.
                          </p>
                          <div className="space-y-3 sm:space-y-4">
                            {additionalContent.map((line, lineIndex) => (
                              <div key={lineIndex} className="border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0">
                                <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                                  <button
                                    onClick={() => playLine(line.start_ms, line.end_ms)}
                                    className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 hover:bg-surface-hover rounded-lg transition-colors flex-shrink-0"
                                    title="Play audio snippet"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                  <div className="flex-1 space-y-1 sm:space-y-2">
                                    <p className="text-sm sm:text-base lg:text-lg font-medium text-text-primary">{line.spanish}</p>
                                    {line.english && (
                                      <p className="text-xs sm:text-sm lg:text-base text-text-secondary italic">{line.english}</p>
                                    )}
                                    {line.explanation && (
                                      <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-1 sm:mt-2">{line.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  return null;
                })}
                {expandedSections.size === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-text-secondary">Select a section above to view its content</p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <Card className="p-8 text-center">
                <p className="text-text-secondary mb-4">Study data is not available for this song yet.</p>
                <p className="text-sm text-text-muted">The structured study format will be available once the data is generated.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SongStudyPage;
