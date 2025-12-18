import { useState } from 'react';
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
import NativeAdHistoryItem from '../components/NativeAdHistoryItem';

type Props = NativeStackScreenProps<RootStackParamList, 'SongHistory'>;

const ITEMS_PER_PAGE = 20;

export default function SongHistoryScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { songHistory, displayedHistory, totalHistoryCount, isLoadingMoreHistory, fetchMoreHistory, isAuthenticated, user } = useUser();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination for displayed items
  // For authenticated users: use totalHistoryCount for total, displayedHistory.length for what's shown
  // For guests: use displayedHistory.length for both
  const totalItems = totalHistoryCount !== null ? totalHistoryCount : displayedHistory.length;
  const displayedItemsCount = displayedHistory.length;
  const totalPages = Math.ceil(displayedItemsCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = displayedHistory.slice(startIndex, endIndex);

  // Check if user should see upgrade message
  const isFreeUser = isAuthenticated && user.subscriptionTier === 'FREE';
  const isPremiumUser = isAuthenticated && user.subscriptionTier === 'PREMIUM';
  const isGuest = !isAuthenticated;
  
  // Determine if user is at their viewing limit
  const freeLimit = 5;
  const premiumLimit = 10;
  const isAtFreeLimit = isFreeUser && totalHistoryCount !== null && totalHistoryCount >= freeLimit;
  const isAtPremiumLimit = isPremiumUser && totalHistoryCount !== null && totalHistoryCount >= premiumLimit;
  const shouldShowUpgradeMessage = (isFreeUser && isAtFreeLimit) || (isPremiumUser && isAtPremiumLimit) || isGuest;

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      // For authenticated users: fetch next page from server if we don't have enough items locally
      if (isAuthenticated) {
        const itemsNeeded = (currentPage + 1) * ITEMS_PER_PAGE;
        if (songHistory.length < itemsNeeded) {
          await fetchMoreHistory();
        }
      }
      setCurrentPage(currentPage + 1);
    }
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
        {/* Upgrade Message for Free Users, Premium Users at Limit, and Guests */}
        {shouldShowUpgradeMessage && (
          <TouchableOpacity
            onPress={() => navigation.navigate('PremiumBenefits')}
            activeOpacity={0.8}
            className="mb-4"
          >
            <View 
              className={theme.bg('bg-primary/10', 'bg-primary/20') + ' rounded-xl px-4 py-4'}
              style={{
                borderWidth: 2,
                borderColor: '#6366F1',
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-start mb-2">
                <View className="mr-3 mt-0.5">
                  <Ionicons name="star" size={24} color="#6366F1" />
                </View>
                <View className="flex-1">
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-bold mb-1'}>
                    {t('history.upgradeTitle')}
                  </Text>
                  <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mb-2'}>
                    {isGuest
                      ? t('history.guestUpgradeMessage')
                      : isFreeUser && isAtFreeLimit
                        ? `Want to see more? You're viewing ${displayedItemsCount} of ${totalHistoryCount} songs. Sign up for Premium to see up to 10 songs, or Premium Plus for unlimited access!`
                      : isPremiumUser && isAtPremiumLimit
                        ? `Want to see more? You're viewing ${displayedItemsCount} of ${totalHistoryCount} songs. Upgrade to Premium Plus for unlimited access!`
                      : t('history.upgradeMessage')
                    }
                  </Text>
                  <Text className="text-primary text-sm font-semibold">
                    {t('history.clickToUpgrade')} →
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Song History List */}
        <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
          {displayedHistory.length === 0 ? (
            <View className="py-12 px-5 items-center">
              <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-base'}>
                {t('history.noHistory')}
              </Text>
              <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm mt-2 text-center'}>
                {t('history.noHistoryDescription')}
              </Text>
            </View>
          ) : (
            currentItems.map((item, index, array) => {
              // Insert ad every 6 items
              const shouldShowAd = (index + 1) % 2 === 0 && index < array.length - 1;
              
              return (
                <View key={`${item.videoId}-${item.date}-${item.time}-${index}`}>
                  {/* Song History Item */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className={`flex-row items-center py-4 px-5 ${
                      !shouldShowAd && index < array.length - 1 ? theme.border('border-border', 'border-[#334155]') + ' border-b' : ''
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
              
              {/* Native Ad - Every 6 items, styled like history item */}
              {shouldShowAd && process.env.SHOWADS !== 'false' && <NativeAdHistoryItem isLastItem={index === array.length - 1} />}
            </View>
              );
            })
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
            {displayedHistory.length > 0 ? (
              (isFreeUser && totalHistoryCount !== null && totalHistoryCount > displayedItemsCount) ||
              (isPremiumUser && totalHistoryCount !== null && totalHistoryCount > displayedItemsCount) ? (
                // Show "Showing X of Y" for users at their limit
                `Showing ${displayedItemsCount} of ${totalHistoryCount}`
              ) : (
                // Show normal pagination for others
                `${t('history.page')} ${currentPage} ${t('history.of')} ${totalPages}`
              )
            ) : (
              t('history.noHistoryShort')
            )}
          </Text>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentPage === totalPages}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${
              currentPage === totalPages
                ? (isDark ? 'bg-[#1E293B]/50 border-[#334155]' : 'bg-surface/50 border-border')
                : theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]')
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`mr-2 text-sm font-medium ${
                currentPage === totalPages ? theme.text('text-text-muted', 'text-[#64748B]') : theme.text('text-text-primary', 'text-[#F1F5F9]')
              }`}
            >
              {currentPage === totalPages ? t('history.lastPage') : t('history.next')}
            </Text>
            {isLoadingMoreHistory ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage === totalPages ? '#64748B' : (isDark ? '#94A3B8' : '#4B5563')}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

