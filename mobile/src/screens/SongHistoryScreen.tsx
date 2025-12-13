import { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { SongHistoryItem } from '../data/songHistory';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';

type Props = NativeStackScreenProps<RootStackParamList, 'SongHistory'>;

const ITEMS_PER_PAGE = 20;

export default function SongHistoryScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { songHistory, totalHistoryCount, isLoadingMoreHistory, hasMoreHistory, fetchMoreHistory, isAuthenticated } = useUser();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination for displayed items
  // Use totalHistoryCount if available (for authenticated users), otherwise use songHistory.length (for guests)
  const totalItems = totalHistoryCount !== null ? totalHistoryCount : songHistory.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = songHistory.slice(startIndex, endIndex);

  // Fetch more history when reaching the last page and there's more available
  useEffect(() => {
    if (isAuthenticated && currentPage === totalPages && hasMoreHistory && !isLoadingMoreHistory && songHistory.length > 0) {
      fetchMoreHistory();
    }
  }, [currentPage, totalPages, hasMoreHistory, isLoadingMoreHistory, isAuthenticated, songHistory.length, fetchMoreHistory]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
    // Note: fetchMoreHistory is automatically called via useEffect when we reach the last page
  };

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>{t('history.title')}</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Song History List */}
        <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
          {songHistory.length === 0 ? (
            <View className="py-12 px-5 items-center">
              <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-base'}>
                {t('history.noHistory')}
              </Text>
              <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm mt-2 text-center'}>
                {t('history.noHistoryDescription')}
              </Text>
            </View>
          ) : (
            currentItems.map((item, index, array) => (
              <TouchableOpacity
                key={`${item.videoId}-${item.date}-${item.time}-${index}`}
                activeOpacity={0.7}
                className={`flex-row items-center py-4 px-5 ${
                  index < array.length - 1 ? theme.border('border-border', 'border-[#334155]') + ' border-b' : ''
                }`}
                onPress={() => {
                  const initialTab = item.mode === 'Play Mode' ? 'PlayMode' : 'StudyMode';
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 1,
                      routes: [
                        { name: 'SongList' },
                        { name: 'SongDetail', params: { videoId: item.videoId, initialTab } },
                      ],
                    })
                  );
                }}
              >
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons
                    name={item.mode === 'Play Mode' ? 'play-circle' : 'school'}
                    size={20}
                    color="#6366F1"
                  />
                </View>
                <View className="flex-1">
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium mb-1'}>
                    {item.song}
                  </Text>
                  <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mb-1'}>
                    {item.artist}
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-primary/10 px-2 py-0.5 rounded mr-2">
                      <Text className="text-xs font-medium text-primary">
                        {item.mode === 'Play Mode' ? t('history.playMode') : t('history.studyMode')}
                      </Text>
                    </View>
                    <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs'}>
                      {item.date} • {item.time}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pagination Controls - Fixed at Bottom */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-t px-5 py-4'}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentPage === 1}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${
              currentPage === 1
                ? (isDark ? 'bg-[#1E293B]/50 border-[#334155]' : 'bg-surface/50 border-border')
                : theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]')
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentPage === 1 ? '#64748B' : (isDark ? '#94A3B8' : '#4B5563')}
            />
            <Text
              className={`ml-2 text-sm font-medium ${
                currentPage === 1 ? theme.text('text-text-muted', 'text-[#64748B]') : theme.text('text-text-primary', 'text-[#F1F5F9]')
              }`}
            >
              {t('history.previous')}
            </Text>
          </TouchableOpacity>

          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
            {songHistory.length > 0 ? `${t('history.page')} ${currentPage} ${t('history.of')} ${totalPages}` : t('history.noHistoryShort')}
          </Text>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentPage === totalPages && !hasMoreHistory}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${
              (currentPage === totalPages && !hasMoreHistory)
                ? (isDark ? 'bg-[#1E293B]/50 border-[#334155]' : 'bg-surface/50 border-border')
                : theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]')
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`mr-2 text-sm font-medium ${
                (currentPage === totalPages && !hasMoreHistory) ? theme.text('text-text-muted', 'text-[#64748B]') : theme.text('text-text-primary', 'text-[#F1F5F9]')
              }`}
            >
              {hasMoreHistory && currentPage === totalPages ? t('history.loadMore') : t('history.next')}
            </Text>
            {isLoadingMoreHistory ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={(currentPage === totalPages && !hasMoreHistory) ? '#64748B' : (isDark ? '#94A3B8' : '#4B5563')}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

