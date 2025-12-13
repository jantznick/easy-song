import { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { SongDetailTabParamList, RootStackParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';

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
  const content = (
    <View className="flex-row items-center py-3 px-5 border-b border-border">
      <View className="w-8 items-center mr-3">
        <Ionicons name={icon} size={22} color="#6366F1" />
      </View>
      <View className="flex-1">
        <Text className="text-base text-text-primary font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-text-secondary mt-0.5">{subtitle}</Text>
        )}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#334155', true: '#6366F1' }}
          thumbColor={value ? '#ffffff' : '#94A3B8'}
          ios_backgroundColor="#334155"
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
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
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide px-5 py-2">
        {title}
      </Text>
      <View className="bg-surface rounded-xl border border-border overflow-hidden">
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
  const {
    preferences,
    updatePlaybackPreference,
    updateDisplayPreference,
    updateLanguagePreference,
  } = useUser();

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
        <Text className="text-lg font-semibold text-text-primary flex-1">Settings</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6 pb-4">

        {/* User Profile Section */}
        <View className="mb-6">
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center p-5"
              onPress={() => navigation.navigate('UserProfileSettings')}
            >
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mr-4">
                <Ionicons name="person" size={32} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-text-primary mb-1">
                  Guest User
                </Text>
                <Text className="text-sm text-text-secondary">
                  Not signed in
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playback Settings */}
        <SettingsSection title="Playback">
          <SettingItem
            icon="play-circle"
            title="Autoplay"
            subtitle="Automatically start playing when opening a song"
            value={preferences.playback.autoplay}
            onValueChange={(value) => updatePlaybackPreference('autoplay', value)}
          />
          <SettingItem
            icon="arrow-down-circle"
            title="Auto-scroll Lyrics"
            subtitle="Automatically scroll to active lyric line"
            value={preferences.playback.autoscroll}
            onValueChange={(value) => updatePlaybackPreference('autoscroll', value)}
          />
          <SettingItem
            icon="repeat"
            title="Loop Song"
            subtitle="Automatically replay when song ends"
            value={false}
            onValueChange={() => {}}
          />
        </SettingsSection>

        {/* Display Settings */}
        <SettingsSection title="Display">
          <View className="flex-row items-center py-3 px-5 border-b border-border">
            <View className="w-8 items-center mr-3">
              <Ionicons name="text" size={22} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-text-primary font-medium mb-2">Font Size</Text>
              <View className="flex-row bg-surface border border-border rounded-full p-1">
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'small')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.fontSize === 'small' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'small' ? 'text-white' : 'text-text-secondary'
                  }`}>
                    S
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'medium')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.fontSize === 'medium' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'medium' ? 'text-white' : 'text-text-secondary'
                  }`}>
                    M
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('fontSize', 'large')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.fontSize === 'large' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.fontSize === 'large' ? 'text-white' : 'text-text-secondary'
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
          <View className="flex-row items-center py-3 px-5 border-b border-border">
            <View className="w-8 items-center mr-3">
              <Ionicons name="color-palette" size={22} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-text-primary font-medium mb-2">Theme</Text>
              <View className="flex-row bg-surface border border-border rounded-full p-1">
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'light')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.theme === 'light' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'light' ? 'text-white' : 'text-text-secondary'
                  }`}>
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'dark')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.theme === 'dark' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'dark' ? 'text-white' : 'text-text-secondary'
                  }`}>
                    Dark
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateDisplayPreference('theme', 'system')}
                  className={`flex-1 py-2 rounded-full ${
                    preferences.display.theme === 'system' ? 'bg-primary' : ''
                  }`}
                >
                  <Text className={`text-sm font-medium text-center ${
                    preferences.display.theme === 'system' ? 'text-white' : 'text-text-secondary'
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
            title="Interface Language"
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
              backgroundColor: '#1E293B',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 32,
              maxHeight: '70%',
            }}
          >
            <View className="p-5 border-b border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold text-text-primary">Learning Language</Text>
                <TouchableOpacity onPress={() => setShowLearningLanguageModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
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
                  className="flex-row items-center justify-between px-5 py-4 border-b border-border"
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-text-primary">{language.name}</Text>
                  {preferences.language.learning === language.name && (
                    <Ionicons name="checkmark" size={24} color="#6366F1" />
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
              backgroundColor: '#1E293B',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 32,
              maxHeight: '70%',
            }}
          >
            <View className="p-5 border-b border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold text-text-primary">Interface Language</Text>
                <TouchableOpacity onPress={() => setShowInterfaceLanguageModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
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
                  className="flex-row items-center justify-between px-5 py-4 border-b border-border"
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-text-primary">{language.name}</Text>
                  {preferences.language.interface === language.name && (
                    <Ionicons name="checkmark" size={24} color="#6366F1" />
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
