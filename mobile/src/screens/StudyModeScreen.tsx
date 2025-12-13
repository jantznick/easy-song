import { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchSongById, fetchStudyData, computeAdditionalContent } from '../utils/api';
import StatusDisplay from '../components/StatusDisplay';
import VideoPlayer from '../components/VideoPlayer';
import type { Song, StudyData, StructuredSection, StructuredLine, LyricLine } from '../types/song';
import type { SongDetailTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'StudyMode'>;

const stopVideo = (player: any, endTime: number, setPlaying: (playing: boolean) => void, onComplete?: () => void) => {
  const interval = setInterval(async () => {
    if (!player.current) {
      clearInterval(interval);
      return;
    }
    try {
      const currentTime = await player.current.getCurrentTime();
      const currentTimeMs = currentTime * 1000;
      console.log('currentTimeMs', currentTimeMs);
      
      if (currentTimeMs >= endTime) {
        console.log('currentTimeMs >= endTime', currentTimeMs, endTime);
        setPlaying(false);
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error checking current time:', error);
      clearInterval(interval);
    }
  }, 100);
  
  return interval;
}


export default function StudyModeScreen({ route }: Props) {
  const { videoId } = route.params;
  const navigation = useNavigation();
  const [song, setSong] = useState<Song | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [additionalContent, setAdditionalContent] = useState<LyricLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  const contentScrollRef = useRef<ScrollView>(null);
  const videoPlayerRef = useRef<any>(null);
  const stopVideoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineRefs = useRef<{ [key: string]: View | null }>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [songData, studyDataResult] = await Promise.all([
          fetchSongById(videoId),
          fetchStudyData(videoId).catch(() => null),
        ]);
        
        setSong(songData);
        setStudyData(studyDataResult);
        setAdditionalContent(computeAdditionalContent(songData, studyDataResult));
        
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
      if (stopVideoIntervalRef.current) {
        clearInterval(stopVideoIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId]);

  // Get all lines from current section for active line tracking
  const getCurrentSectionLines = (): (StructuredLine | LyricLine)[] => {
    if (expandedSectionIndex === null || !studyData) return [];
    
    const sections = studyData.structuredSections || [];
    
    if (expandedSectionIndex < sections.length) {
      return sections[expandedSectionIndex].lines;
    } else if (expandedSectionIndex === sections.length) {
      return additionalContent;
    }
    return [];
  };

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex === null) return;

    const lineKey = expandedSectionIndex !== null 
      ? `${expandedSectionIndex}-${activeLineIndex}` 
      : null;
    
    if (!lineKey) return;

    const activeLineRef = lineRefs.current[lineKey];
    const containerRef = contentScrollRef.current;

    if (activeLineRef && containerRef) {
      activeLineRef.measureLayout(
        containerRef as any,
        (x, y, width, height) => {
          containerRef.scrollTo({
            y: Math.max(0, y - 16),
            animated: true,
          });
        },
        () => {
          // Error callback - layout measurement failed
        }
      );
    }
  }, [activeLineIndex, expandedSectionIndex]);

  // Handle player state change - start/stop interval for tracking progress
  const onPlayerStateChange = (event: string) => {
    if (event === 'playing') {
      // Start interval to check current time
      progressIntervalRef.current = setInterval(async () => {
        if (!videoPlayerRef.current) return;
        
        const currentLines = getCurrentSectionLines();
        if (currentLines.length === 0) return;
        
        try {
          const currentTime = await videoPlayerRef.current.getCurrentTime();
          const currentTimeMs = currentTime * 1000;
          
          const currentLineIndex = currentLines.findIndex(
            line => currentTimeMs >= line.start_ms && currentTimeMs <= line.end_ms
          );
          
          if (currentLineIndex !== -1) {
            setActiveLineIndex(currentLineIndex);
          } else {
            setActiveLineIndex(null);
          }
        } catch (error) {
          console.error('Error getting current time:', error);
        }
      }, 250);
    } else {
      // Paused, ended, etc. - clear interval and update playing state
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Update playing state when video pauses or ends
      if (event === 'paused' || event === 'ended') {
        setPlaying(false);
      }
    }
  };

  // Reset active line when section changes
  useEffect(() => {
    setActiveLineIndex(null);
    setPlaying(false);
  }, [expandedSectionIndex]);

  const handlePlayAllClick = () => {
    if (expandedSectionIndex === null) return;
    
    // If already playing, pause
    if (playing) {
      setPlaying(false);
      if (stopVideoIntervalRef.current) {
        clearInterval(stopVideoIntervalRef.current);
        stopVideoIntervalRef.current = null;
      }
      return;
    }
    
    let firstLine: StructuredLine | LyricLine | null = null;
    let lastLine: StructuredLine | LyricLine | null = null;
    
    if (expandedSectionIndex < sections.length) {
      const section = sections[expandedSectionIndex];
      if (section.lines.length > 0) {
        firstLine = section.lines[0];
        lastLine = section.lines[section.lines.length - 1];
      }
    } else if (expandedSectionIndex === sections.length && additionalContent.length > 0) {
      firstLine = additionalContent[0];
      lastLine = additionalContent[additionalContent.length - 1];
    }
    
    if (!firstLine || !lastLine) return;
    
    // Clear any existing interval
    if (stopVideoIntervalRef.current) {
      clearInterval(stopVideoIntervalRef.current);
    }
    
    videoPlayerRef.current?.seekTo(firstLine.start_ms / 1000, true);
    setPlaying(true);
    stopVideoIntervalRef.current = stopVideo(
      videoPlayerRef, 
      lastLine.end_ms, 
      setPlaying,
      () => {
        // Mark section as completed when playback finishes
        setCompletedSections(prev => new Set([...prev, expandedSectionIndex]));
        setActiveLineIndex(null);
      }
    );
  };

  const expandNextSection = (currentSectionIndex: number) => {
    if (!studyData) return;
    const allSections = studyData.structuredSections.length + (additionalContent.length > 0 ? 1 : 0);
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < allSections) {
      setExpandedSectionIndex(nextIndex);
      setExpandedExplanations(prev => new Set([...prev, nextIndex]));
      setActiveLineIndex(null);
    }
  };

  const handleLinePlayClick = (line: StructuredLine | LyricLine, lineIndex: number) => {
    console.log('Line play clicked:', {
      sectionIndex: expandedSectionIndex,
      lineIndex: lineIndex,
      spanish: line.spanish,
      english: line.english,
      start_ms: line.start_ms,
      end_ms: line.end_ms,
      explanation: 'explanation' in line ? line.explanation : undefined,
    });
    // Clear any existing interval
    if (stopVideoIntervalRef.current) {
      clearInterval(stopVideoIntervalRef.current);
    }
    
    videoPlayerRef.current?.seekTo(line.start_ms / 1000, true);
    setPlaying(true);
    stopVideoIntervalRef.current = stopVideo(videoPlayerRef, line.end_ms, setPlaying);
  };

  if (isLoading || error || !song) {
    return <StatusDisplay loading={isLoading} error={error || (!song ? 'Song not found' : null)} loadingText="Loading study data..." />;
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
      <VideoPlayer ref={videoPlayerRef} videoId={videoId} play={playing} onChangeState={onPlayerStateChange} />

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

          {/* Play All Button and Next Section Button */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handlePlayAllClick}
              className="flex-row items-center gap-2 px-4 py-2 bg-primary rounded-lg"
            >
              <Ionicons
                name={playing ? "pause" : "play"}
                size={20}
                color="#ffffff"
              />
              <Text className="text-sm font-medium text-white">
                {playing ? "Pause" : "Play All"}
              </Text>
            </TouchableOpacity>
            {expandedSectionIndex !== null && completedSections.has(expandedSectionIndex) && (
              <TouchableOpacity
                onPress={() => expandNextSection(expandedSectionIndex)}
                className="flex-row items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
              >
                <Text className="text-sm font-medium text-white">
                  Next →
                </Text>
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
                        const isActive = activeLineIndex === lineIndex && expandedSectionIndex < sections.length;
                        return (
                          <View
                            key={lineIndex}
                            ref={(ref) => {
                              lineRefs.current[lineKey] = ref;
                            }}
                            style={{
                              paddingBottom: 16,
                              marginBottom: 16,
                              borderBottomWidth: lineIndex < sections[expandedSectionIndex].lines.length - 1 ? 1 : 0,
                              borderBottomColor: '#334155',
                              borderLeftWidth: 4,
                              borderLeftColor: isActive ? '#6366F1' : 'transparent',
                              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                              paddingLeft: isActive ? 12 : 0,
                              marginLeft: isActive ? -4 : 0,
                              borderRadius: isActive ? 8 : 0,
                            }}
                          >
                            <View className="flex-row items-start gap-3">
                              <TouchableOpacity
                                onPress={() => handleLinePlayClick(line, lineIndex)}
                                className="mt-1 p-2"
                              >
                                <Ionicons name="play" size={20} color="#6366F1" />
                              </TouchableOpacity>
                              <View className="flex-1">
                                <Text style={{
                                  fontSize: 16,
                                  fontWeight: isActive ? '600' : '500',
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
                      {additionalContent.map((line, lineIndex) => {
                        const lineKey = `${expandedSectionIndex}-${lineIndex}`;
                        const isActive = activeLineIndex === lineIndex && expandedSectionIndex === sections.length;
                        return (
                          <View
                            key={lineIndex}
                            ref={(ref) => {
                              lineRefs.current[lineKey] = ref;
                            }}
                            style={{
                              paddingBottom: 16,
                              marginBottom: 16,
                              borderBottomWidth: lineIndex < additionalContent.length - 1 ? 1 : 0,
                              borderBottomColor: '#334155',
                              borderLeftWidth: 4,
                              borderLeftColor: isActive ? '#6366F1' : 'transparent',
                              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                              paddingLeft: isActive ? 12 : 0,
                              marginLeft: isActive ? -4 : 0,
                              borderRadius: isActive ? 8 : 0,
                            }}
                          >
                            <View className="flex-row items-start gap-3">
                              <TouchableOpacity
                                onPress={() => handleLinePlayClick(line, lineIndex)}
                                className="mt-1 p-2"
                              >
                                <Ionicons name="play" size={20} color="#6366F1" />
                              </TouchableOpacity>
                              <View className="flex-1">
                                <Text style={{
                                  fontSize: 16,
                                  fontWeight: isActive ? '600' : '500',
                                  color: isActive ? '#6366F1' : '#F1F5F9',
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
                        );
                      })}
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

