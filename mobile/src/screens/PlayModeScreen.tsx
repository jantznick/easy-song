import { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchSongById } from '../utils/api';
import VideoPlayer from '../components/VideoPlayer';
import type { Song, SongSection, LyricLine } from '../types/song';
import type { SongDetailTabParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { getFontSizes } from '../utils/fontSizes';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'PlayMode'>;

export default function PlayModeScreen({ route }: Props) {
  const { videoId } = route.params;
  const navigation = useNavigation();
  const { preferences } = useUser();
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
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch song: ${e.message}`);
        } else {
          setError('An unknown error occurred.');
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
    };
  }, [videoId]);

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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-text-secondary text-base">Loading song...</Text>
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
        <Text className="text-lg font-semibold text-text-primary flex-1" numberOfLines={1}>
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
              <Text className="text-base font-semibold text-text-primary mr-2">
                {song.title}
              </Text>
              <Text className="text-sm text-text-secondary">
                • {song.artist}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Scrollable Lyrics Container */}
      <View className="flex-1 px-5">
        <View className="bg-surface rounded-xl border border-border flex-1">
          {/* Lyrics Header with Toggle */}
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <Text className="text-lg font-semibold text-text-primary">Lyrics</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-text-secondary mr-2">Show translations</Text>
              <Switch
                value={showTranslations}
                onValueChange={setShowTranslations}
                trackColor={{ false: '#334155', true: '#6366F1' }}
                thumbColor={showTranslations ? '#ffffff' : '#94A3B8'}
                ios_backgroundColor="#334155"
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
                  style={[
                    {
                      marginBottom: 12,
                      padding: 16,
                      borderRadius: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: isActive ? '#6366F1' : 'transparent',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      shadowColor: isActive ? '#6366F1' : 'transparent',
                      shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
                      shadowOpacity: isActive ? 0.1 : 0,
                      shadowRadius: isActive ? 8 : 0,
                      elevation: isActive ? 4 : 0,
                    }
                  ]}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.main,
                      lineHeight: fontSizes.lineHeight.main,
                      marginBottom: showTranslations && line.english ? 4 : 0,
                      color: isActive ? '#6366F1' : '#94A3B8',
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
                        color: '#64748B',
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

