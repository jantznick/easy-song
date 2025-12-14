import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeClasses, cn } from '../utils/themeClasses';
import { saveOnboardingComplete } from '../utils/storage';
import AuthDrawer from '../components/AuthDrawer';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
}

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useThemeClasses();
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);

  const pages: OnboardingPage[] = [
    {
      id: 'welcome',
      icon: 'musical-notes',
      title: t('settings.onboarding.welcome.title'),
      description: t('settings.onboarding.welcome.description'),
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'playMode',
      icon: 'play-circle',
      title: t('settings.onboarding.playMode.title'),
      description: t('settings.onboarding.playMode.description'),
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: 'studyMode',
      icon: 'school',
      title: t('settings.onboarding.studyMode.title'),
      description: t('settings.onboarding.studyMode.description'),
      gradient: ['#4facfe', '#00f2fe'],
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      flatListRef.current?.scrollToOffset({
        offset: prevPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(prevPage);
    }
  };

  const handleSkip = async () => {
    await saveOnboardingComplete();
    navigation.replace('SongList');
  };

  const handleGetStarted = async () => {
    await saveOnboardingComplete();
    navigation.replace('SongList');
  };

  const handleSignUp = () => {
    setShowAuthDrawer(true);
  };

  const handleAuthSuccess = async () => {
    await saveOnboardingComplete();
    navigation.replace('SongList');
  };

  const renderPage = ({ item, index }: { item: OnboardingPage; index: number }) => (
    <View
      className={cn('flex-1 justify-center items-center', theme.bg('bg-white', 'bg-gray-900'))}
      style={{ width: SCREEN_WIDTH }}
    >
      {/* Back button - show on pages 2 and 3 (index 1 and 2) */}
      {index > 0 && (
        <TouchableOpacity
          className="absolute top-16 left-5 z-10 p-2"
          onPress={handleBack}
        >
          <Text className={cn('text-base font-semibold', theme.text('text-gray-600', 'text-gray-400'))}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      )}

      <View className="flex-1 justify-center items-center px-8 pt-24">
        {/* Icon with gradient background */}
        <View
          className="w-40 h-40 rounded-full justify-center items-center mb-12"
          style={{ backgroundColor: item.gradient[0] + '20' }}
        >
          <Ionicons
            name={item.icon}
            size={80}
            color={item.gradient[0]}
          />
        </View>

        {/* Title */}
        <Text className={cn('text-3xl font-bold text-center mb-4', theme.text('text-gray-900', 'text-white'))}>
          {item.title}
        </Text>

        {/* Description */}
        <Text className={cn('text-lg text-center leading-7 px-4', theme.text('text-gray-600', 'text-gray-300'))}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View className="flex-row justify-center items-center mt-8 mb-4">
      {pages.map((_, index) => (
        <View
          key={index}
          className={cn(
            'h-2 rounded mx-1',
            index === currentPage
              ? theme.bg('bg-gray-900', 'bg-white')
              : theme.bg('bg-gray-300', 'bg-gray-600')
          )}
          style={{ width: index === currentPage ? 24 : 8 }}
        />
      ))}
    </View>
  );

  return (
    <View className={cn('flex-1', theme.bg('bg-white', 'bg-gray-900'))}>
      {/* Skip button */}
      {currentPage < pages.length - 1 && (
        <TouchableOpacity
          className="absolute top-16 right-5 z-10 p-2"
          onPress={handleSkip}
        >
          <Text className={cn('text-base font-semibold', theme.text('text-gray-600', 'text-gray-400'))}>
            {t('settings.onboarding.skip')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Swipeable pages */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={({ item, index }) => renderPage({ item, index })}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination dots */}
      {renderPagination()}

      {/* Action buttons */}
      <View className="px-8 pb-12">
        {currentPage < pages.length - 1 ? (
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 rounded-xl gap-2"
            style={{ backgroundColor: pages[currentPage].gradient[0] }}
            onPress={handleNext}
          >
            <Text className="text-white text-lg font-semibold">{t('settings.onboarding.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View className="gap-3">
            <TouchableOpacity
              className={cn('py-4 rounded-xl items-center', theme.bg('bg-gray-200', 'bg-gray-700'))}
              onPress={handleGetStarted}
            >
              <Text className={cn('text-lg font-semibold', theme.text('text-gray-900', 'text-white'))}>
                {t('settings.onboarding.continueAsGuest')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: pages[currentPage].gradient[0] }}
              onPress={handleSignUp}
            >
              <Text className="text-white text-lg font-semibold">{t('settings.onboarding.signUp')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Auth Drawer */}
      <AuthDrawer
        visible={showAuthDrawer}
        onClose={() => setShowAuthDrawer(false)}
        initialMode="signup"
        onSuccess={handleAuthSuccess}
      />
    </View>
  );
}

