import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../hooks/useUser';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

interface UserProfileCardProps {
  onPress?: () => void;
}

export default function UserProfileCard({ onPress }: UserProfileCardProps) {
  const { profile, songHistory, isAuthenticated } = useUser();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Calculate stats
  const songsLearned = songHistory.length;
  const playModeCount = songHistory.filter(item => item.mode === 'Play Mode').length;
  const studyModeCount = songHistory.filter(item => item.mode === 'Study Mode').length;

  return (
    <View
      className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' mx-4 mt-4 mb-6 rounded-3xl border overflow-hidden'}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      {/* Gradient-like header background */}
      <View className={theme.bg('bg-primary/20', 'bg-indigo-500/20') + ' px-6 pt-6 pb-4'}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            {/* Avatar */}
            <View className={theme.bg('bg-primary', 'bg-indigo-500') + ' w-16 h-16 rounded-full items-center justify-center mr-4'}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            
            {/* User Info */}
            <View className="flex-1">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-1'}>
                {profile.name}
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
                {isAuthenticated ? profile.email : t('common.guest') || 'Guest User'}
              </Text>
            </View>
          </View>

          {/* Settings Icon */}
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDark ? '#94A3B8' : '#4B5563'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View className="px-6 py-4">
        <View className="flex-row justify-around">
          {/* Songs Learned */}
          <View className="items-center flex-1">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-1'}>
              {songsLearned}
            </Text>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-xs text-center'}>
              {t('profile.songsLearned') || 'Songs Learned'}
            </Text>
          </View>

          {/* Divider */}
          <View className={theme.bg('bg-border', 'bg-[#334155]') + ' w-px mx-2'} />

          {/* Play Mode */}
          <View className="items-center flex-1">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-1'}>
              {playModeCount}
            </Text>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-xs text-center'}>
              {t('profile.playMode') || 'Play Mode'}
            </Text>
          </View>

          {/* Divider */}
          <View className={theme.bg('bg-border', 'bg-[#334155]') + ' w-px mx-2'} />

          {/* Study Mode */}
          <View className="items-center flex-1">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-1'}>
              {studyModeCount}
            </Text>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-xs text-center'}>
              {t('profile.studyMode') || 'Study Mode'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

