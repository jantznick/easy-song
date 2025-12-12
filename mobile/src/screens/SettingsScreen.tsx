import { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { SongDetailTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'Settings'>;

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
  const { videoId } = route.params;

  // Placeholder state - will be functional later
  const [autoplay, setAutoplay] = useState(false);
  const [autoscroll, setAutoscroll] = useState(true);
  const [showTranslations, setShowTranslations] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6 pb-4">
          <Text className="text-3xl font-bold text-text-primary">Settings</Text>
        </View>

        {/* User Profile Section */}
        <View className="mb-6">
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center p-5"
              onPress={() => {}}
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

        {/* Account Settings */}
        <SettingsSection title="Account">
          <SettingItem
            icon="person-circle"
            title="Edit Profile"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="mail"
            title="Email"
            subtitle="user@example.com"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="lock-closed"
            title="Change Password"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="log-in"
            title="Sign In"
            subtitle="Sign in to sync your progress"
            showArrow
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Playback Settings */}
        <SettingsSection title="Playback">
          <SettingItem
            icon="play-circle"
            title="Autoplay"
            subtitle="Automatically start playing when opening a song"
            value={autoplay}
            onValueChange={setAutoplay}
          />
          <SettingItem
            icon="arrow-down-circle"
            title="Auto-scroll Lyrics"
            subtitle="Automatically scroll to active lyric line"
            value={autoscroll}
            onValueChange={setAutoscroll}
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
          <SettingItem
            icon="text"
            title="Font Size"
            subtitle={fontSize === 'small' ? 'Small' : fontSize === 'medium' ? 'Medium' : 'Large'}
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="language"
            title="Default Translation"
            subtitle="Show translations by default"
            value={showTranslations}
            onValueChange={setShowTranslations}
          />
          <SettingItem
            icon="color-palette"
            title="Theme"
            subtitle="Dark"
            showArrow
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Language Settings */}
        <SettingsSection title="Language">
          <SettingItem
            icon="globe"
            title="Learning Language"
            subtitle="Spanish"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="language"
            title="Interface Language"
            subtitle="English"
            showArrow
            onPress={() => {}}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingItem
            icon="information-circle"
            title="App Version"
            subtitle="1.0.0"
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            showArrow
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy Policy"
            showArrow
            onPress={() => {}}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

