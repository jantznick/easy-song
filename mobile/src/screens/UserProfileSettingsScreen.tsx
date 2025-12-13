import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { ALL_SONG_HISTORY } from '../data/songHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfileSettings'>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = false }: SettingItemProps) {
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
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      )}
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

export default function UserProfileSettingsScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
              <View className="flex-row items-center p-5">
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
              </View>
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

          {/* Song History */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 py-2">
              <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Song History
              </Text>
            </View>
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              {ALL_SONG_HISTORY.slice(0, 3).map((item, index, array) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
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
                  className={`flex-row items-center py-4 px-5 ${
                    index < array.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Ionicons
                      name={item.mode === 'Play Mode' ? 'play-circle' : 'school'}
                      size={20}
                      color="#6366F1"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-text-primary font-medium mb-1">
                      {item.song}
                    </Text>
                    <Text className="text-sm text-text-secondary mb-1">
                      {item.artist}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-primary/10 px-2 py-0.5 rounded mr-2">
                        <Text className="text-xs text-primary font-medium">
                          {item.mode}
                        </Text>
                      </View>
                      <Text className="text-xs text-text-muted">
                        {item.date} • {item.time}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => navigation.navigate('SongHistory')}
                activeOpacity={0.7}
                className="flex-row items-center justify-center py-4 px-5 border-t border-border"
              >
                <Text className="text-base text-primary font-medium mr-2">View All</Text>
                <Ionicons name="chevron-forward" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


