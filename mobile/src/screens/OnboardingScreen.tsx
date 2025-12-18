import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeClasses, cn } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { saveOnboardingComplete } from '../utils/storage';
import { useUser } from '../contexts/UserContext';
import { LANGUAGE_NAME_MAP } from '../i18n/config';
import { usei18n } from '../contexts/i18nContext';
import AuthDrawer from '../components/AuthDrawer';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  isLanguagePage?: boolean;
}

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { updateLanguagePreference } = useUser();
  const { availableLanguages } = usei18n();
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [learningLanguage, setLearningLanguage] = useState('Spanish');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [showLearningDropdown, setShowLearningDropdown] = useState(false);
  const [showNativeDropdown, setShowNativeDropdown] = useState(false);

  // Get language names from available languages (fallback to defaults if not loaded yet)
  const supportedLanguages = availableLanguages.length > 0 
    ? availableLanguages.map(lang => lang.name)
    : ['English', 'Spanish', 'Chinese (Mandarin)', 'French', 'German'];

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
    {
      id: 'language',
      icon: 'language',
      title: t('settings.onboarding.language.title'),
      description: t('settings.onboarding.language.description'),
      gradient: ['#fa709a', '#fee140'],
      isLanguagePage: true,
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

  const handleSkip = () => {
    // Skip to the last page (language selection)
    const lastPage = pages.length - 1;
    flatListRef.current?.scrollToOffset({
      offset: lastPage * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPage(lastPage);
  };

  const handleGetStarted = async () => {
    // Save language preferences
    await updateLanguagePreference('learning', learningLanguage);
    await updateLanguagePreference('interface', nativeLanguage);
    await saveOnboardingComplete();
    navigation.replace('SongList');
  };

  const handleSignUp = () => {
    setShowAuthDrawer(true);
  };

  const handleAuthSuccess = async () => {
    // Save language preferences
    await updateLanguagePreference('learning', learningLanguage);
    await updateLanguagePreference('interface', nativeLanguage);
    await saveOnboardingComplete();
    navigation.replace('SongList');
  };

  const renderLanguageDropdown = (
    selected: string,
    onSelect: (lang: string) => void,
    show: boolean,
    onClose: () => void
  ) => (
    <Modal
      visible={show}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: isDark ? '#1E293B' : '#ffffff',
            margin: 20,
            borderRadius: 12,
            padding: 16,
            maxHeight: '60%',
            width: '80%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className={cn('text-lg font-semibold', theme.text('text-gray-900', 'text-white'))}>
              {t('settings.onboarding.language.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={supportedLanguages}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className={cn(
                  'py-3 px-4 rounded-lg mb-2',
                  selected === item
                    ? theme.bg('bg-indigo-100', 'bg-indigo-900/30')
                    : theme.bg('bg-transparent', 'bg-transparent')
                )}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={cn('text-base', theme.text('text-gray-900', 'text-white'))}>
                    {item}
                  </Text>
                  {selected === item && (
                    <Ionicons name="checkmark" size={20} color="#6366F1" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderPage = ({ item, index }: { item: OnboardingPage; index: number }) => {
    if (item.isLanguagePage) {
      return (
        <View
          className={cn('flex-1 justify-center items-center', theme.bg('bg-white', 'bg-gray-900'))}
          style={{ width: SCREEN_WIDTH }}
        >
          {/* Back button */}
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
            <Text className={cn('text-lg text-center leading-7 px-4 mb-8', theme.text('text-gray-600', 'text-gray-300'))}>
              {item.description}
            </Text>

            {/* Language Selection Dropdowns */}
            <View className="w-full gap-4">
              {/* Learning Language */}
              <View>
                <Text className={cn('text-sm font-medium mb-2', theme.text('text-gray-700', 'text-gray-300'))}>
                  {t('settings.onboarding.language.learningLanguage')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLearningDropdown(true)}
                  className={cn(
                    'border rounded-xl px-4 py-3 flex-row items-center justify-between',
                    theme.bg('bg-white', 'bg-gray-800'),
                    theme.border('border-gray-300', 'border-gray-600')
                  )}
                >
                  <Text className={cn('text-base', theme.text('text-gray-900', 'text-white'))}>
                    {learningLanguage}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
              </View>

              {/* Native Language */}
              <View>
                <Text className={cn('text-sm font-medium mb-2', theme.text('text-gray-700', 'text-gray-300'))}>
                  {t('settings.onboarding.language.nativeLanguage')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowNativeDropdown(true)}
                  className={cn(
                    'border rounded-xl px-4 py-3 flex-row items-center justify-between',
                    theme.bg('bg-white', 'bg-gray-800'),
                    theme.border('border-gray-300', 'border-gray-600')
                  )}
                >
                  <Text className={cn('text-base', theme.text('text-gray-900', 'text-white'))}>
                    {nativeLanguage}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        className={cn('flex-1 justify-center items-center', theme.bg('bg-white', 'bg-gray-900'))}
        style={{ width: SCREEN_WIDTH }}
      >
        {/* Back button - show on pages 2, 3, and 4 (index 1, 2, and 3) */}
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
  };

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
      {/* Skip button - show on pages 1-3 (index 0-2) */}
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

      {/* Language Dropdowns */}
      {renderLanguageDropdown(
        learningLanguage,
        setLearningLanguage,
        showLearningDropdown,
        () => setShowLearningDropdown(false)
      )}
      {renderLanguageDropdown(
        nativeLanguage,
        setNativeLanguage,
        showNativeDropdown,
        () => setShowNativeDropdown(false)
      )}

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
