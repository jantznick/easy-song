import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchSongById, fetchStudyData, computeAdditionalContent } from '../utils/api';
import StatusDisplay from '../components/StatusDisplay';
import VideoPlayer from '../components/VideoPlayer';
import type { Song, StudyData, StructuredSection, StructuredLine, LyricLine } from '../types/song';
import type { SongDetailTabParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { getFontSizes } from '../utils/fontSizes';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';

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
      
      if (currentTimeMs >= endTime) {
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
  const { preferences, addToHistory } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const [song, setSong] = useState<Song | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [additionalContent, setAdditionalContent] = useState<LyricLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTranslations, setShowTranslations] = useState<boolean>(preferences.display.defaultTranslation);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  const contentScrollRef = useRef<ScrollView>(null);
  const videoPlayerRef = useRef<any>(null);
  const stopVideoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineRefs = useRef<{ [key: string]: View | null }>({});
  const historySavedRef = useRef<boolean>(false); // Track if history has been saved for this videoId

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
        
        // Reset history saved flag when videoId changes
        historySavedRef.current = false;
        
        // Auto-expand first section if study data exists
        if (studyDataResult && studyDataResult.structuredSections.length > 0) {
          setExpandedSectionIndex(0);
          setExpandedExplanations(new Set([0]));
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch data: ${e.message}`);
        } else {
          setError(t('songs.errorDescription'));
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
      // Reset history saved flag when component unmounts or videoId changes
      historySavedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]); // Only depend on videoId, not addToHistory

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
  // Only scrolls if autoscroll preference is enabled
  useEffect(() => {
    if (activeLineIndex === null || !preferences.playback.autoscroll) return;

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
  }, [activeLineIndex, expandedSectionIndex, preferences.playback.autoscroll]);

  // Handle player state change - start/stop interval for tracking progress
  const onPlayerStateChange = (event: string) => {
    if (event === 'playing') {
      // Save history when video starts playing (only once per videoId)
      if (!historySavedRef.current && song) {
        historySavedRef.current = true;
        addToHistory(song.title, song.artist, 'Study Mode', videoId);
      }
      
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

  // Sync showTranslations with preference when preferences load from storage
  useEffect(() => {
    setShowTranslations(preferences.display.defaultTranslation);
  }, [preferences.display.defaultTranslation]);

  // Get font sizes based on preference (must be before any early returns)
  const fontSizes = useMemo(() => getFontSizes(preferences.display.fontSize), [preferences.display.fontSize]);

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
    
    const sections = studyData?.structuredSections || [];
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
    // Clear any existing interval
    if (stopVideoIntervalRef.current) {
      clearInterval(stopVideoIntervalRef.current);
    }
    
    videoPlayerRef.current?.seekTo(line.start_ms / 1000, true);
    setPlaying(true);
    stopVideoIntervalRef.current = stopVideo(videoPlayerRef, line.end_ms, setPlaying);
  };

  const sections = studyData?.structuredSections || [];
  const hasStudyData = studyData !== null;
  const currentSection = expandedSectionIndex !== null && expandedSectionIndex < sections.length 
    ? sections[expandedSectionIndex] 
    : null;

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Custom Header */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-b px-5 py-4 flex-row items-center'}>
        <TouchableOpacity
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('SongList' as never);
            }
          }}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl'}>←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold'} numberOfLines={1}>
            {song?.title || t('studyMode.title')}
          </Text>
          {song && (
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-xs'}>{t('studyMode.title')}</Text>
          )}
        </View>
      </View>

      {/* Show loading or error state */}
      {(isLoading || error || !song) && (
        <View className="flex-1 justify-center items-center px-8">
          {isLoading ? (
            <StatusDisplay loading={true} loadingText={t('studyMode.loadingData')} />
          ) : (
            <View className="items-center">
              <View className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-4">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              </View>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-2 text-center'}>
                {t('common.error')}
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base text-center mb-6'}>
                {error || (!song ? t('studyMode.songNotFound') : null)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('SongList' as never);
                  }
                }}
                className="bg-primary rounded-xl py-3 px-6"
              >
                <Text className="text-white text-center font-semibold">
                  {t('common.back')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Main Content - only show if loaded successfully */}
      {!isLoading && !error && song && (
        <>

      {/* Fixed Video Player */}
      <VideoPlayer ref={videoPlayerRef} videoId={videoId} play={playing} onChangeState={onPlayerStateChange} />

      {/* Fixed Section Pills - Completely Separate Container */}
      {hasStudyData && (
        <View className="py-3">
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
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: expandedSectionIndex === index ? '#6366F1' : (isDark ? '#1E293B' : '#FFFFFF'),
                  borderWidth: expandedSectionIndex === index ? 0 : 1,
                  borderColor: isDark ? '#334155' : '#E4E7EB',
                }}
              >
                <Text className="text-sm font-medium" style={{
                  color: expandedSectionIndex === index ? '#FFFFFF' : (isDark ? '#94A3B8' : '#4B5563'),
                }}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
            {additionalContent.length > 0 && (
              <TouchableOpacity
                onPress={() => setExpandedSectionIndex(sections.length)}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: expandedSectionIndex === sections.length ? '#6366F1' : (isDark ? '#1E293B' : '#FFFFFF'),
                  borderWidth: expandedSectionIndex === sections.length ? 0 : 1,
                  borderColor: isDark ? '#334155' : '#E4E7EB',
                }}
              >
                <Text className="text-sm font-medium" style={{
                  color: expandedSectionIndex === sections.length ? '#FFFFFF' : (isDark ? '#94A3B8' : '#4B5563'),
                }}>
                  {t('studyMode.additional')}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Fixed Section Explanation and Play Button - Completely Separate Container */}
      {hasStudyData && currentSection && (
        <View className="px-5 pb-4">
          {/* Section Explanation */}
          {currentSection.sectionExplanation && (
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border mb-4 overflow-hidden'}>
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
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm font-medium'}>{t('studyMode.sectionExplanation')}</Text>
                <Ionicons
                  name={expandedExplanations.has(expandedSectionIndex!) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6366F1"
                />
              </TouchableOpacity>
              {expandedExplanations.has(expandedSectionIndex!) && (
                <View className={theme.border('border-border', 'border-[#334155]') + ' p-4 border-t'}>
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm leading-6'}>
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
                {playing ? t('studyMode.pause') : t('studyMode.playAll')}
              </Text>
            </TouchableOpacity>
            {expandedSectionIndex !== null && completedSections.has(expandedSectionIndex) && (
              <TouchableOpacity
                onPress={() => expandNextSection(expandedSectionIndex)}
                className="flex-row items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
              >
                <Text className="text-sm font-medium text-white">
                  {t('studyMode.nextSection')} →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Scrollable Lyrics Content - Completely Separate Container */}
      {hasStudyData ? (
        <View className="flex-1 px-5">
          <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border flex-1'}>
            {/* Content Header with Toggle */}
            <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center justify-between p-5 border-b'}>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold'}>{t('studyMode.studyContent')}</Text>
              <View className="flex-row items-center">
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mr-2'}>{t('studyMode.showTranslations')}</Text>
                <Switch
                  value={showTranslations}
                  onValueChange={setShowTranslations}
                  trackColor={{ false: isDark ? '#334155' : '#E4E7EB', true: '#6366F1' }}
                  thumbColor={showTranslations ? '#ffffff' : (isDark ? '#94A3B8' : '#9CA3AF')}
                  ios_backgroundColor={isDark ? '#334155' : '#E4E7EB'}
                />
              </View>
            </View>

            <ScrollView
              ref={contentScrollRef}
              className="flex-1"
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Lines Content */}
              {expandedSectionIndex !== null && (
                <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-4'}>
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
                                  fontSize: fontSizes.main,
                                  fontWeight: isActive ? '600' : '500',
                                  color: isActive ? '#6366F1' : (isDark ? '#F1F5F9' : '#1A1F2E'),
                                  marginBottom: 4,
                                }}>
                                  {line.spanish}
                                </Text>
                                {showTranslations && line.english && (
                                  <Text style={{
                                    fontSize: fontSizes.translation,
                                    lineHeight: fontSizes.lineHeight.translation,
                                    color: isDark ? '#94A3B8' : '#4B5563',
                                    fontStyle: 'italic',
                                    marginBottom: line.explanation ? 8 : 0,
                                  }}>
                                    {line.english}
                                  </Text>
                                )}
                                {line.explanation && (
                                  <Text style={{
                                    fontSize: fontSizes.explanation,
                                    color: isDark ? '#64748B' : '#9CA3AF',
                                    lineHeight: fontSizes.lineHeight.explanation,
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
                      <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm mb-4 italic'}>
                        {t('studyMode.additionalContentNote')}
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
                                  fontSize: fontSizes.main,
                                  fontWeight: isActive ? '600' : '500',
                                  color: isActive ? '#6366F1' : '#F1F5F9',
                                  marginBottom: 4,
                                }}>
                                  {line.spanish}
                                </Text>
                                {showTranslations && line.english && (
                                  <Text style={{
                                    fontSize: fontSizes.translation,
                                    lineHeight: fontSizes.lineHeight.translation,
                                    color: '#94A3B8',
                                    fontStyle: 'italic',
                                  }}>
                                    {line.english}
                                  </Text>
                                )}
                                {line.explanation && (
                                  <Text style={{
                                    fontSize: fontSizes.explanation,
                                    color: '#64748B',
                                    lineHeight: fontSizes.lineHeight.explanation,
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
                <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-8 items-center'}>
                  <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]')}>{t('studyMode.selectSection')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-8 items-center'}>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' mb-2 text-center'}>{t('studyMode.studyDataNotAvailable')}</Text>
            <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm text-center'}>
              {t('studyMode.studyDataNotAvailableDescription')}
            </Text>
          </View>
        </View>
      )}
      </>
      )}
    </SafeAreaView>
  );
}

