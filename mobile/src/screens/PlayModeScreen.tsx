import { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchSongById } from '../utils/api';
import VideoPlayer from '../components/VideoPlayer';
import StatusDisplay from '../components/StatusDisplay';
import type { Song, SongSection, LyricLine } from '../types/song';
import type { SongDetailTabParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { getFontSizes } from '../utils/fontSizes';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'PlayMode'>;

export default function PlayModeScreen({ route }: Props) {
  const { videoId } = route.params;
  const navigation = useNavigation();
  const { preferences, addToHistory } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playing, setPlaying] = useState(false);
  const [showTranslations, setShowTranslations] = useState<boolean>(preferences.display.defaultTranslation);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsContainerRef = useRef<ScrollView>(null);
  const lineRefs = useRef<{ [key: number]: View | null }>({});
  const historySavedRef = useRef<boolean>(false); // Track if history has been saved for this videoId

  // Flatten all lines from all sections
  const allLines = useMemo(() => {
    if (!song) return [];
    return song.sections.flatMap(section => section.lines);
  }, [song]);

  // Get font sizes based on preference
  const fontSizes = useMemo(() => getFontSizes(preferences.display.fontSize), [preferences.display.fontSize]);

  useEffect(() => {
    const getSong = async () => {
      try {
        const data = await fetchSongById(videoId);
        setSong(data);
        // Reset history saved flag when videoId changes
        historySavedRef.current = false;
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch song: ${e.message}`);
        } else {
          setError(t('songs.errorDescription'));
        }
        console.error('Failed to fetch song:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSong();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Reset history saved flag when component unmounts or videoId changes
      historySavedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]); // Only depend on videoId, not addToHistory

  // Sync showTranslations with preference when preferences load from storage
  useEffect(() => {
    setShowTranslations(preferences.display.defaultTranslation);
  }, [preferences.display.defaultTranslation]);

  // Autoplay: Start playing when song loads if autoplay is enabled
  useEffect(() => {
    if (!isLoading && song && preferences.playback.autoplay) {
      // Small delay to ensure video player is ready
      const timer = setTimeout(() => {
        setPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, song, preferences.playback.autoplay]);

  // Auto-scroll to active line (matches frontend implementation)
  // Only scrolls if autoscroll preference is enabled
  useEffect(() => {
    if (activeLineIndex === null || !preferences.playback.autoscroll) return;

    const activeLineRef = lineRefs.current[activeLineIndex];
    const containerRef = lyricsContainerRef.current;

    if (activeLineRef && containerRef) {
      // Measure the line's position relative to the ScrollView
      activeLineRef.measureLayout(
        containerRef as any,
        (x, y, width, height) => {
          // Scroll to position the line 16px from the top (matching frontend)
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
  }, [activeLineIndex, preferences.playback.autoscroll]);

  // Handle player state change - start/stop interval for tracking progress
  const onPlayerStateChange = (event: string) => {
    if (event === 'playing') {
      // Save history when video starts playing (only once per videoId)
      if (!historySavedRef.current && song) {
        historySavedRef.current = true;
        addToHistory(song.title, song.artist, 'Play Mode', videoId);
      }
      
      // Start interval to check current time
      intervalRef.current = setInterval(async () => {
        if (!playerRef.current || !allLines.length) return;
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          const currentTimeMs = currentTime * 1000;
          
          const currentLineIndex = allLines.findIndex(
            line => currentTimeMs >= line.start_ms && currentTimeMs <= line.end_ms
          );
          
          if (currentLineIndex !== -1) {
            setActiveLineIndex(currentLineIndex);
          }
        } catch (error) {
          console.error('Error getting current time:', error);
        }
      }, 250);
    } else {
      // Paused, ended, etc. - clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleLinePress = (line: LyricLine) => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(line.start_ms / 1000, true);
        setPlaying(true);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  if (isLoading || error || !song) {
    return <StatusDisplay loading={isLoading} error={error || (!song ? t('songs.songNotFound') : null)} loadingText={t('songs.loadingSong')} />;
  }

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Custom Header */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-b px-5 py-4 flex-row items-center'}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl'}>←</Text>
        </TouchableOpacity>
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'} numberOfLines={1}>
          {song.title}
        </Text>
      </View>

      {/* Fixed Content - Video and Song Info */}
      <View>
        {/* YouTube Video Player */}
        <VideoPlayer
          ref={playerRef}
          videoId={videoId}
          play={playing}
          onChangeState={(event) => {
            if (event === 'playing') {
              setPlaying(true);
            } else if (event === 'paused' || event === 'ended') {
              setPlaying(false);
            }
            // Handle active line tracking
            onPlayerStateChange(event);
          }}
        />

        {/* Song Info */}
        <View className="px-5 pt-6 pb-6">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View className="flex-row items-center">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mr-2'}>
                {song.title}
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
                • {song.artist}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Scrollable Lyrics Container */}
      <View className="flex-1 px-5">
        <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border flex-1'}>
          {/* Lyrics Header with Toggle */}
          <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center justify-between p-5 border-b'}>
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold'}>{t('playMode.lyrics')}</Text>
            <View className="flex-row items-center">
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mr-2'}>{t('playMode.showTranslations')}</Text>
              <Switch
                value={showTranslations}
                onValueChange={setShowTranslations}
                trackColor={{ false: isDark ? '#334155' : '#E4E7EB', true: '#6366F1' }}
                thumbColor={showTranslations ? '#ffffff' : (isDark ? '#94A3B8' : '#9CA3AF')}
                ios_backgroundColor={isDark ? '#334155' : '#E4E7EB'}
              />
            </View>
          </View>
          
          {/* Scrollable Lyrics List */}
          <ScrollView 
            ref={lyricsContainerRef}
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {allLines.map((line, index) => {
              const isActive = activeLineIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  ref={(ref) => {
                    lineRefs.current[index] = ref;
                  }}
                  onPress={() => handleLinePress(line)}
                  activeOpacity={0.7}
                  className="mb-3 p-4 rounded-lg"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: isActive ? '#6366F1' : 'transparent',
                    backgroundColor: isActive ? '#6366F133' : 'transparent',
                    shadowColor: isActive ? '#6366F1' : 'transparent',
                    shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
                    shadowOpacity: isActive ? 0.1 : 0,
                    shadowRadius: isActive ? 8 : 0,
                    elevation: isActive ? 4 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.main,
                      lineHeight: fontSizes.lineHeight.main,
                      marginBottom: showTranslations && line.english ? 4 : 0,
                      color: isActive ? '#6366F1' : (isDark ? '#94A3B8' : '#4B5563'),
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {line.spanish}
                  </Text>
                  {showTranslations && line.english && (
                    <Text
                      style={{
                        fontSize: fontSizes.translation,
                        lineHeight: fontSizes.lineHeight.translation,
                        color: isDark ? '#64748B' : '#9CA3AF',
                        fontStyle: 'italic',
                      }}
                    >
                      {line.english}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

