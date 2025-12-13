import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SongSummary } from '../types/song';
import { fetchSongs } from '../utils/api';
import SongListItem from '../components/SongListItem';
import type { RootStackParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';

// TODO: Future implementation - Filter songs by learning language preference
// When backend supports language filtering, use preferences.language.learning
// Example: fetchSongs({ language: preferences.language.learning })

type Props = NativeStackScreenProps<RootStackParamList, 'SongList'>;

export default function SongListScreen({ navigation }: Props) {
  const { preferences } = useUser();
  const { t } = useTranslation();
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSongs = async () => {
      try {
        // TODO: When backend supports language filtering, pass learning language:
        // const data = await fetchSongs({ language: preferences.language.learning });
        const data = await fetchSongs();
        setSongs(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch songs: ${e.message}. Is the backend server running?`);
        } else {
          setError('An unknown error occurred.');
        }
        console.error('Failed to fetch songs:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSongs();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-[#0F172A]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-base text-text-secondary dark:text-[#94A3B8]">{t('songs.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-[#0F172A]">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center mb-2 text-lg font-semibold text-red-500">Error</Text>
          <Text className="text-center text-base text-text-secondary dark:text-[#94A3B8]">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0F172A]">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-5 border-b border-border dark:border-[#334155] flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-text-primary dark:text-[#F1F5F9]">{t('songs.title')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings', {})}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <View className="items-center py-20 px-4">
            <View className="p-5 rounded-full bg-surface dark:bg-[#1E293B] mb-5">
              <Text className="text-5xl">🎵</Text>
            </View>
            <Text className="text-lg font-semibold mb-1 text-text-primary dark:text-[#F1F5F9]">{t('songs.noSongs')}</Text>
            <Text className="text-sm text-text-muted dark:text-[#64748B]">{t('songs.noSongsDescription')}</Text>
          </View>
        ) : (
          <View className="px-4 pt-5">
            <View className="flex-row flex-wrap justify-between">
              {songs.map((song) => (
                <View key={song.videoId} className="w-[48%] mb-4">
                  <SongListItem
                    song={song}
                    onPress={() => navigation.navigate('SongDetail', { videoId: song.videoId })}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
