import { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { SongDetailTabParamList, RootStackParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeClasses } from '../utils/themeClasses';

// Support both tab navigator (from SongDetail) and stack navigator (from root)
type SettingsScreenProps = 
  | BottomTabScreenProps<SongDetailTabParamList, 'Settings'>
  | NativeStackScreenProps<RootStackParamList, 'Settings'>;

type Props = SettingsScreenProps;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, value, onPress, onValueChange, showArrow = false }: SettingItemProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  
  const content = (
    <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center py-3 px-5 border-b'}>
      <View className="w-8 items-center mr-3">
        <Ionicons name={icon} size={22} color="#6366F1" />
      </View>
      <View className="flex-1">
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium'}>{title}</Text>
        {subtitle && (
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mt-0.5'}>{subtitle}</Text>
        )}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: isDark ? '#334155' : '#E4E7EB', true: '#6366F1' }}
          thumbColor={value ? '#ffffff' : (isDark ? '#94A3B8' : '#9CA3AF')}
          ios_backgroundColor={isDark ? '#334155' : '#E4E7EB'}
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useThemeClasses();
  
  return (
    <View className="mb-6">
      <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs font-semibold uppercase tracking-wide px-5 py-2'}>
        {title}
      </Text>
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen({ route }: Props) {
  // videoId is optional - only present when accessed from SongDetail tab
  // When accessed from tab navigator, route.params has videoId
  // When accessed from stack navigator, route.params may be undefined or have optional videoId
  const videoId = route.params && 'videoId' in route.params ? route.params.videoId : undefined;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    profile,
    isAuthenticated,
    preferences,
    updatePlaybackPreference,
    updateDisplayPreference,
    updateLanguagePreference,
  } = useUser();
  const theme = useThemeClasses();

  const [showLearningLanguageModal, setShowLearningLanguageModal] = useState(false);
  const [showInterfaceLanguageModal, setShowInterfaceLanguageModal] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'zh', name: 'Chinese (Mandarin)' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ];

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Custom Header */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-b px-5 py-4 flex-row items-center'}>
        {!videoId && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl'}>←</Text>
          </TouchableOpacity>
        )}
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>Settings</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6 pb-4">

        {/* User Profile Section */}
        <View className="mb-6">
          <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center p-5"
              onPress={() => navigation.navigate('UserProfileSettings')}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center mr-4 bg-primary/20">
                <Ionicons name="person" size={32} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-1'}>
                  {profile.name}
                </Text>
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
                  {isAuthenticated ? profile.email : 'Not signed in'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playback Settings */}
        <SettingsSection title={t('settings.playback.title')}>
          <SettingItem
            icon="play-circle"
            title={t('settings.playback.autoplay')}
            subtitle={t('settings.playback.autoplayDescription')}
            value={preferences.playback.autoplay}
            onValueChange={(value) => updatePlaybackPreference('autoplay', value)}
          />
          <SettingItem
            icon="arrow-down-circle"
            title={t('settings.playback.autoscroll')}
            subtitle={t('settings.playback.autoscrollDescription')}
            value={preferences.playback.autoscroll}
            onValueChange={(value) => updatePlaybackPreference('autoscroll', value)}
          />
          <SettingItem
            icon="repeat"
            title={t('settings.playback.loop')}
            subtitle={t('settings.playback.loopDescription')}
            value={preferences.playback.loop}
            onValueChange={(value) => updatePlaybackPreference('loop', value)}
          />
        </SettingsSection>

        {/* Display Settings */}
        <SettingsSection title="Display">
          <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center py-3 px-5 border-b'}>
            <View className="w-8 items-center mr-3">
              <Ionicons name="text" size={22} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium mb-2'}>Font Size</Text>
              <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' flex-row border rounded-full p-1'}>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'small')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.fontSize === 'small' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'small' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    S
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'medium')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.fontSize === 'medium' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'medium' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    M
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'large')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.fontSize === 'large' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'large' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    L
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <SettingItem
            icon="language"
            title="Default Translation"
            subtitle="Show translations by default"
            value={preferences.display.defaultTranslation}
            onValueChange={(value) => updateDisplayPreference('defaultTranslation', value)}
          />
          <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center py-3 px-5 border-b'}>
            <View className="w-8 items-center mr-3">
              <Ionicons name="color-palette" size={22} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium mb-2'}>Theme</Text>
              <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' flex-row border rounded-full p-1'}>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'light')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.theme === 'light' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'light' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'dark')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.theme === 'dark' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'dark' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    Dark
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'system')}
                  className="flex-1 py-2 rounded-full"
                  style={{
                    backgroundColor: preferences.display.theme === 'system' ? '#6366F1' : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'system' ? 'text-white' : theme.text('text-text-secondary', 'text-[#94A3B8]')
                  }`}>
                    System
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SettingsSection>

        {/* Language Settings */}
        <SettingsSection title="Language">
          <SettingItem
            icon="globe"
            title="Learning Language"
            subtitle={preferences.language.learning}
            showArrow
            onPress={() => setShowLearningLanguageModal(true)}
          />
          <SettingItem
            icon="language"
            title={t('settings.language.interface')}
            subtitle={preferences.language.interface}
            showArrow
            onPress={() => setShowInterfaceLanguageModal(true)}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingItem
            icon="information-circle"
            title="App Version"
            subtitle="1.0.0"
            showArrow
            onPress={() => navigation.navigate('About')}
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            showArrow
            onPress={() => navigation.navigate('Help')}
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            showArrow
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy Policy"
            showArrow
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          </SettingsSection>
        </View>
      </ScrollView>

      {/* Learning Language Modal */}
      <Modal
        visible={showLearningLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLearningLanguageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Pressable 
            style={{ flex: 1 }}
            onPress={() => setShowLearningLanguageModal(false)}
          />
          <View 
            style={{ 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 32,
              maxHeight: '70%',
            }}
          >
            <View className={theme.border('border-border', 'border-[#334155]') + ' p-5 border-b'}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold'}>Learning Language</Text>
                <TouchableOpacity onPress={() => setShowLearningLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#94A3B8' : '#4B5563'} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  onPress={() => {
                    updateLanguagePreference('learning', language.name);
                    setShowLearningLanguageModal(false);
                  }}
                  className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center justify-between px-5 py-4 border-b'}
                  activeOpacity={0.7}
                >
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base'}>{language.name}</Text>
                  {preferences.language.learning === language.name && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interface Language Modal */}
      <Modal
        visible={showInterfaceLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInterfaceLanguageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Pressable 
            style={{ flex: 1 }}
            onPress={() => setShowInterfaceLanguageModal(false)}
          />
          <View 
            style={{ 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 32,
              maxHeight: '70%',
            }}
          >
            <View className={theme.border('border-border', 'border-[#334155]') + ' p-5 border-b'}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold'}>Interface Language</Text>
                <TouchableOpacity onPress={() => setShowInterfaceLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#94A3B8' : '#4B5563'} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  onPress={() => {
                    updateLanguagePreference('interface', language.name);
                    setShowInterfaceLanguageModal(false);
                  }}
                  className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center justify-between px-5 py-4 border-b'}
                  activeOpacity={0.7}
                >
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base'}>{language.name}</Text>
                  {preferences.language.interface === language.name && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
