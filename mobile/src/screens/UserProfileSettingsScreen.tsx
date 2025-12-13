import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

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
  const navigation = useNavigation();

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
        <Text className="text-lg font-semibold text-text-primary flex-1">User Profile</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

