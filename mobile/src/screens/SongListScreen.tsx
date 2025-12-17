import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SongsResponse, SongSummary } from '../types/song';
import { fetchSongs } from '../utils/api';
import SongListItem from '../components/SongListItem';
import UserProfileCard from '../components/UserProfileCard';
import StatusDisplay from '../components/StatusDisplay';
import AdModal from '../components/AdModal';
import NativeAdSongCard from '../components/NativeAdSongCard';
import type { RootStackParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeClasses } from '../utils/themeClasses';

// TODO: Future implementation - Filter songs by learning language preference
// When backend supports language filtering, use preferences.language.learning
// Example: fetchSongs({ language: preferences.language.learning })

type Props = NativeStackScreenProps<RootStackParamList, 'SongList'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.48; // 48% of screen width for 2 columns with gap
const HORIZONTAL_PADDING = 16;
const ITEM_GAP = 8;

export default function SongListScreen({ navigation }: Props) {
  const { preferences } = useUser();
  const { t } = useTranslation();
  const theme = useThemeClasses();
  const [sections, setSections] = useState<SongsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);

  // Fetch songs on mount
  useEffect(() => {
    const getSongs = async () => {
      try {
        // Fetch songs in sections format
        const data = await fetchSongs({ format: 'sections' });
        if (data && 'sections' in data) {
          setSections(data);
        } else {
          // Fallback: if we get flat array, convert to sections format
          const flatSongs = data as SongSummary[];
          setSections({
            sections: [{
              id: 'all',
              title: 'all', // Use a key instead of translated text
              songs: flatSongs,
            }],
          });
        }
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch songs: ${e.message}. Is the backend server running?`);
        } else {
          setError(t('songs.errorDescription'));
        }
        console.error('Failed to fetch songs:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSongs();
  }, []);

  // Show ad randomly (33% chance) every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Show ad modal 33% of the time when navigating to this screen
      const shouldShowAd = process.env.NODE_ENV === 'development' ? true : Math.random() < 0.33;
      if (shouldShowAd) {
        // Delay slightly so the UI settles before showing the ad
        const timer = setTimeout(() => {
          setShowAdModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [])
  );

  const renderSection = ({ item: section }: { item: { id: string; title: string; songs: SongSummary[] } }) => {
    if (section.songs.length === 0) return null;

    // Translate "All Songs" section title if it's the 'all' section
    const sectionTitle = section.id === 'all' || section.title === 'All Songs' || section.title === 'all'
      ? t('songs.allSongs') 
      : section.title;
    
    // Insert ad as first item in "All Songs" section
    const isAllSongsSection = section.id === 'all' || section.title === 'all';
    const listData = isAllSongsSection 
      ? [{ type: 'ad' } as const, ...section.songs.map(song => ({ type: 'song' as const, song }))]
      : section.songs.map(song => ({ type: 'song' as const, song }));

    return (
      <View className="mb-8">
        {/* Section Title */}
        <View className="px-4 mb-3">
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold'}>
            {sectionTitle}
          </Text>
        </View>

        {/* Horizontal Scrollable Songs */}
        <FlatList
          data={listData}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          keyExtractor={(item, index) => item.type === 'ad' ? 'native-ad' : item.song.videoId}
          renderItem={({ item }) => (
            <View style={{ width: ITEM_WIDTH, marginRight: ITEM_GAP }}>
              {item.type === 'ad' ? (
                <NativeAdSongCard />
              ) : (
                <SongListItem
                  song={item.song}
                  onPress={() => navigation.navigate('SongDetail', { videoId: item.song.videoId })}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="px-4 py-8 items-center">
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
                {t('songs.noSongsInSection') || 'No songs in this section'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Ad Modal - shows 33% of the time */}
      <AdModal 
        visible={showAdModal} 
        onClose={() => setShowAdModal(false)} 
      />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <UserProfileCard onPress={() => navigation.navigate('Settings', {})} />

        <StatusDisplay 
          loading={isLoading} 
          loadingText={t('songs.loading')}
          error={error}
        />

        {!isLoading && !error && (
          <>
            {/* Header */}
            <View className={theme.border('border-border', 'border-[#334155]') + ' px-5 pt-2 pb-4 border-b flex-row items-center justify-between mb-2'}>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-3xl font-bold'}>{t('songs.title')}</Text>
            </View>

            {/* Sections */}
            {!sections || sections.sections.length === 0 ? (
              <View className="items-center py-20 px-4">
                <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' p-5 rounded-full mb-5'}>
                  <Text className="text-5xl">🎵</Text>
                </View>
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-1'}>
                  {t('songs.noSongs')}
                </Text>
                <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm'}>
                  {t('songs.noSongsDescription')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={sections.sections}
                renderItem={renderSection}
                keyExtractor={(section) => section.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View className="items-center py-20 px-4">
                    <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' p-5 rounded-full mb-5'}>
                      <Text className="text-5xl">🎵</Text>
                    </View>
                    <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-1'}>
                      {t('songs.noSongs')}
                    </Text>
                    <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm'}>
                      {t('songs.noSongsDescription')}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
