import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import YoutubePlayer from 'react-native-youtube-iframe';
import { fetchSongById, fetchStudyData } from '../utils/api';
import type { Song, StudyData, StructuredSection, StructuredLine, LyricLine } from '../types/song';
import type { SongDetailTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'StudyMode'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

export default function StudyModeScreen({ route }: Props) {
  const { videoId } = route.params;
  const navigation = useNavigation();
  const [song, setSong] = useState<Song | null>(null);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playing, setPlaying] = useState(false);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [playingSection, setPlayingSection] = useState<number | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  
  // Sync refs with state for button display
  useEffect(() => {
    playingSectionRef.current = playingSection;
  }, [playingSection]);
  
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const playerRef = useRef<any>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const lineRefs = useRef<{ [key: string]: View | null }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimeouts = useRef<NodeJS.Timeout[]>([]);
  // Use refs for state that needs to be checked in callbacks to avoid stale closures
  const playingSectionRef = useRef<number | null>(null);
  const playingRef = useRef<boolean>(false);

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
      return !coveredTimeRanges.some(range => {
        return (line.start_ms >= range.start && line.start_ms <= range.end) ||
               (line.end_ms >= range.start && line.end_ms <= range.end) ||
               (line.start_ms <= range.start && line.end_ms >= range.end);
      });
    });
  }, [studyData, allOriginalLines, coveredTimeRanges]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [songData, studyDataResult] = await Promise.all([
          fetchSongById(videoId),
          fetchStudyData(videoId).catch(() => null),
        ]);
        
        setSong(songData);
        setStudyData(studyDataResult);
        
        // Auto-expand first section if study data exists
        if (studyDataResult && studyDataResult.structuredSections.length > 0) {
          setExpandedSectionIndex(0);
          setExpandedExplanations(new Set([0]));
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch data: ${e.message}`);
        } else {
          setError('An unknown error occurred.');
        }
        console.error('Failed to fetch data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      playbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [videoId]);

  // Handle player state change - track active line
  const onPlayerStateChange = (event: string) => {
    if (event === 'playing') {
      setPlaying(true);
      playingRef.current = true;
      
      // Only start interval if we're playing a section (not just a single line)
      if (playingSectionRef.current !== null) {
        // Clear any existing interval first
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(async () => {
          if (!playerRef.current || !studyData || playingSectionRef.current === null) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
          try {
            const currentTime = await playerRef.current.getCurrentTime();
            const currentTimeMs = currentTime * 1000;
            
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
              // Update active line and section
              setActiveLineIndex(foundLineIndex);
              setActiveSectionIndex(foundSectionIndex);
              
              // Auto-expand section if not already expanded
              setExpandedSectionIndex(prevExpanded => {
                if (prevExpanded !== foundSectionIndex) {
                  setExpandedExplanations(prevExp => new Set([...prevExp, foundSectionIndex!]));
                }
                return foundSectionIndex;
              });
            }
          } catch (error) {
            console.error('Error getting current time:', error);
          }
        }, 250);
      }
    } else if (event === 'paused' || event === 'ended') {
      setPlaying(false);
      playingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (event === 'ended') {
        setPlayingSection(null);
        playingSectionRef.current = null;
        setActiveLineIndex(null);
        setActiveSectionIndex(null);
      }
    }
  };

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex === null || activeSectionIndex === null || !contentScrollRef.current) return;

    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const lineKey = `${activeSectionIndex}-${activeLineIndex}`;
      const lineRef = lineRefs.current[lineKey];
      if (lineRef && contentScrollRef.current) {
        lineRef.measureLayout(
          contentScrollRef.current as any,
          (x, y, width, height) => {
            if (contentScrollRef.current) {
              contentScrollRef.current.scrollTo({
                y: Math.max(0, y - 16),
                animated: true,
              });
            }
          },
          () => {
            // Error callback - layout measurement failed
          }
        );
      }
    }, 100);
  }, [activeLineIndex, activeSectionIndex]);

  const playLine = (startMs: number, endMs: number) => {
    if (!playerRef.current) return;
    
    // Clear existing timeouts and intervals
    playbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    playbackTimeouts.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear section playing state when playing individual line
    setPlayingSection(null);
    playingSectionRef.current = null;
    setActiveLineIndex(null);
    setActiveSectionIndex(null);
    
    // Seek and play
    playerRef.current.seekTo(startMs / 1000, true);
    setPlaying(true);
    playingRef.current = true;
    
    // Auto-pause at end - duration is in milliseconds
    const durationMs = endMs - startMs;
    const timeout = setTimeout(() => {
      setPlaying(false);
      playingRef.current = false;
      playbackTimeouts.current = playbackTimeouts.current.filter(t => t !== timeout);
    }, durationMs);
    
    playbackTimeouts.current.push(timeout);
  };

  const playSection = async (section: StructuredSection, sectionIndex: number) => {
    if (!playerRef.current || section.lines.length === 0) return;
    
    // If already playing this section, pause instead
    if (playingSectionRef.current === sectionIndex && playingRef.current) {
      // Force pause by setting play to false immediately
      playingRef.current = false;
      setPlaying(false);
      setPlayingSection(null);
      playingSectionRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear timeouts
      playbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
      playbackTimeouts.current = [];
      return;
    }
    
    // Clear existing timeouts and intervals
    playbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    playbackTimeouts.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set section state BEFORE seeking/playing
    setPlayingSection(sectionIndex);
    playingSectionRef.current = sectionIndex;
    setActiveLineIndex(null);
    setActiveSectionIndex(null);
    
    // Seek to start
    const startTime = section.lines[0].start_ms / 1000;
    playerRef.current.seekTo(startTime, true);
    
    // Set playing state - the player will start playing
    setPlaying(true);
    playingRef.current = true;
    
    // Mark as completed when reaching end - duration is in milliseconds
    const lastLine = section.lines[section.lines.length - 1];
    const totalDurationMs = lastLine.end_ms - section.lines[0].start_ms;
    
    const completeTimeout = setTimeout(() => {
      setCompletedSections(prev => new Set([...prev, sectionIndex]));
      setPlayingSection(null);
      playingSectionRef.current = null;
      setActiveLineIndex(null);
      setActiveSectionIndex(null);
      setPlaying(false);
      playingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      playbackTimeouts.current = playbackTimeouts.current.filter(t => t !== completeTimeout);
    }, totalDurationMs);
    
    playbackTimeouts.current.push(completeTimeout);
  };

  const expandNextSection = (currentSectionIndex: number) => {
    if (!studyData) return;
    const allSections = studyData.structuredSections.length + (additionalContent.length > 0 ? 1 : 0);
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < allSections) {
      setExpandedSectionIndex(nextIndex);
      if (nextIndex < studyData.structuredSections.length) {
        setExpandedExplanations(prev => new Set([...prev, nextIndex]));
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-text-secondary text-base">Loading study data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !song) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-400 text-center mb-2 text-lg font-semibold">Error</Text>
          <Text className="text-text-secondary text-center text-base">{error || 'Song not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sections = studyData?.structuredSections || [];
  const hasStudyData = studyData !== null;
  const currentSection = expandedSectionIndex !== null && expandedSectionIndex < sections.length 
    ? sections[expandedSectionIndex] 
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="bg-surface border-b border-border px-5 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-2xl text-text-primary">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text-primary" numberOfLines={1}>
            {song.title}
          </Text>
          <Text className="text-xs text-text-secondary">Study Mode</Text>
        </View>
      </View>

      {/* Fixed Video Player */}
      <View>
        <View className="bg-black" style={{ height: VIDEO_HEIGHT }}>
          <YoutubePlayer
            ref={playerRef}
            height={VIDEO_HEIGHT}
            width={SCREEN_WIDTH}
            videoId={videoId}
            play={playing}
            onChangeState={onPlayerStateChange}
          />
        </View>
      </View>

      {/* Fixed Section Pills - Completely Separate Container */}
      {hasStudyData && (
        <View style={{ paddingVertical: 12 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {sections.map((section, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setExpandedSectionIndex(index);
                  setExpandedExplanations(prev => new Set([...prev, index]));
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: expandedSectionIndex === index ? '#6366F1' : '#1E293B',
                  borderWidth: expandedSectionIndex === index ? 0 : 1,
                  borderColor: '#334155',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: expandedSectionIndex === index ? '#FFFFFF' : '#94A3B8',
                }}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
            {additionalContent.length > 0 && (
              <TouchableOpacity
                onPress={() => setExpandedSectionIndex(sections.length)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: expandedSectionIndex === sections.length ? '#6366F1' : '#1E293B',
                  borderWidth: expandedSectionIndex === sections.length ? 0 : 1,
                  borderColor: '#334155',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: expandedSectionIndex === sections.length ? '#FFFFFF' : '#94A3B8',
                }}>
                  Additional
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Fixed Section Explanation and Play Button - Completely Separate Container */}
      {hasStudyData && currentSection && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {/* Section Explanation */}
          {currentSection.sectionExplanation && (
            <View className="bg-surface rounded-xl border border-border mb-4 overflow-hidden">
              <TouchableOpacity
                onPress={() => {
                  const newExpanded = new Set(expandedExplanations);
                  if (newExpanded.has(expandedSectionIndex!)) {
                    newExpanded.delete(expandedSectionIndex!);
                  } else {
                    newExpanded.add(expandedSectionIndex!);
                  }
                  setExpandedExplanations(newExpanded);
                }}
                className="flex-row items-center justify-between p-4 bg-primary/10"
              >
                <Text className="text-sm font-medium text-text-primary">Section Explanation</Text>
                <Ionicons
                  name={expandedExplanations.has(expandedSectionIndex!) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6366F1"
                />
              </TouchableOpacity>
              {expandedExplanations.has(expandedSectionIndex!) && (
                <View className="p-4 border-t border-border">
                  <Text className="text-sm text-text-primary leading-6">
                    {currentSection.sectionExplanation}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Play All Button */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => playSection(currentSection, expandedSectionIndex!)}
              className="flex-row items-center gap-2 px-4 py-2 bg-primary rounded-lg"
            >
              <Ionicons
                name={playingSection === expandedSectionIndex && playing ? 'pause' : 'play'}
                size={20}
                color="#ffffff"
              />
              <Text className="text-sm font-medium text-white">
                {playingSection === expandedSectionIndex && playing ? 'Pause' : 'Play All'}
              </Text>
            </TouchableOpacity>
            {completedSections.has(expandedSectionIndex!) && (
              <TouchableOpacity
                onPress={() => expandNextSection(expandedSectionIndex!)}
                className="flex-row items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
              >
                <Text className="text-sm font-medium text-white">Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Scrollable Lyrics Content - Completely Separate Container */}
      {hasStudyData ? (
        <ScrollView
          ref={contentScrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={true}
        >

              {/* Lines Content */}
              {expandedSectionIndex !== null && (
                <View className="bg-surface rounded-xl border border-border p-4">
                  {expandedSectionIndex < sections.length ? (
                    <View>
                      {sections[expandedSectionIndex].lines.map((line, lineIndex) => {
                        const lineKey = `${expandedSectionIndex}-${lineIndex}`;
                        const isActive = activeLineIndex === lineIndex && activeSectionIndex === expandedSectionIndex;
                        return (
                          <View
                            key={lineIndex}
                            ref={(ref) => {
                              lineRefs.current[lineKey] = ref;
                            }}
                            style={[
                              {
                                paddingBottom: 16,
                                marginBottom: 16,
                                borderBottomWidth: lineIndex < sections[expandedSectionIndex].lines.length - 1 ? 1 : 0,
                                borderBottomColor: '#334155',
                              },
                              isActive && {
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 12,
                                borderLeftWidth: 4,
                                borderLeftColor: '#6366F1',
                              }
                            ]}
                          >
                            <View className="flex-row items-start gap-3">
                              <TouchableOpacity
                                onPress={() => playLine(line.start_ms, line.end_ms)}
                                className="mt-1 p-2"
                              >
                                <Ionicons name="play" size={20} color="#6366F1" />
                              </TouchableOpacity>
                              <View className="flex-1">
                                <Text style={{
                                  fontSize: 16,
                                  fontWeight: '500',
                                  color: isActive ? '#6366F1' : '#F1F5F9',
                                  marginBottom: 4,
                                }}>
                                  {line.spanish}
                                </Text>
                                <Text style={{
                                  fontSize: 14,
                                  color: '#94A3B8',
                                  fontStyle: 'italic',
                                  marginBottom: line.explanation ? 8 : 0,
                                }}>
                                  {line.english}
                                </Text>
                                {line.explanation && (
                                  <Text style={{
                                    fontSize: 13,
                                    color: '#64748B',
                                    lineHeight: 20,
                                  }}>
                                    {line.explanation}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : expandedSectionIndex === sections.length && additionalContent.length > 0 ? (
                    <View>
                      <Text className="text-sm text-text-muted mb-4 italic">
                        These lines weren't included in the structured sections above.
                      </Text>
                      {additionalContent.map((line, lineIndex) => (
                        <View
                          key={lineIndex}
                          style={{
                            paddingBottom: 16,
                            marginBottom: 16,
                            borderBottomWidth: lineIndex < additionalContent.length - 1 ? 1 : 0,
                            borderBottomColor: '#334155',
                          }}
                        >
                          <View className="flex-row items-start gap-3">
                            <TouchableOpacity
                              onPress={() => playLine(line.start_ms, line.end_ms)}
                              className="mt-1 p-2"
                            >
                              <Ionicons name="play" size={20} color="#6366F1" />
                            </TouchableOpacity>
                            <View className="flex-1">
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: '#F1F5F9',
                                marginBottom: 4,
                              }}>
                                {line.spanish}
                              </Text>
                              {line.english && (
                                <Text style={{
                                  fontSize: 14,
                                  color: '#94A3B8',
                                  fontStyle: 'italic',
                                }}>
                                  {line.english}
                                </Text>
                              )}
                              {line.explanation && (
                                <Text style={{
                                  fontSize: 13,
                                  color: '#64748B',
                                  lineHeight: 20,
                                  marginTop: 8,
                                }}>
                                  {line.explanation}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}

              {expandedSectionIndex === null && (
                <View className="bg-surface rounded-xl border border-border p-8 items-center">
                  <Text className="text-text-secondary">Select a section above to view its content</Text>
                </View>
              )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <View className="bg-surface rounded-xl border border-border p-8 items-center">
            <Text className="text-text-secondary mb-2 text-center">Study data is not available</Text>
            <Text className="text-sm text-text-muted text-center">
              The structured study format will be available once the data is generated.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

