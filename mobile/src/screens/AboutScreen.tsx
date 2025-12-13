import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeClasses } from '../utils/themeClasses';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

interface VersionItemProps {
  version: string;
  date: string;
  changes: string[];
}

function VersionItem({ version, date, changes }: VersionItemProps) {
  const theme = useThemeClasses();
  
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold'}>Version {version}</Text>
        <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm'}>{date}</Text>
      </View>
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-4'}>
        {changes.map((change, index) => (
          <View key={index} className="flex-row items-start mb-2">
            <Text className="text-primary mr-2 mt-1">•</Text>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm flex-1 leading-6'}>{change}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AboutScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();

  const versions = [
    {
      version: '1.0.0',
      date: 'January 2025',
      changes: [
        'Initial release of Easy Song',
        'Play Mode with YouTube video integration',
        'Study Mode with structured sections and explanations',
        'Lyric highlighting and auto-scrolling',
        'Translation toggle functionality',
        'User settings and preferences',
        'Multi-language support',
      ],
    },
    {
      version: '0.9.0',
      date: 'December 2024',
      changes: [
        'Beta testing release',
        'Core playback functionality',
        'Basic study mode features',
      ],
    },
    {
      version: '0.8.0',
      date: 'November 2024',
      changes: [
        'Initial development build',
        'Song list and navigation',
        'Video player integration',
      ],
    },
  ];

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>About</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {/* App Info */}
          <View className="mb-6">
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-6 items-center'}>
              <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
                <Ionicons name="musical-notes" size={40} color="#6366F1" />
              </View>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-2'}>Easy Song</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base mb-4'}>Version 1.0.0</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm text-center leading-6'}>
                Learn Spanish through music. Watch videos, study lyrics, and improve your language skills with structured lessons.
              </Text>
            </View>
          </View>

          {/* Developer Studio Info */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>Development Studio</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-3'}>Your Studio Name</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-4'}>
                We're passionate about creating innovative language learning tools that make education engaging and accessible.
              </Text>
              <View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="mail" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>contact@yourstudio.com</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="globe" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>www.yourstudio.com</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="logo-twitter" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>@yourstudio</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Version History */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>Version History</Text>
            {versions.map((version, index) => (
              <VersionItem
                key={index}
                version={version.version}
                date={version.date}
                changes={version.changes}
              />
            ))}
          </View>

          {/* Credits */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>Credits</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                Easy Song uses YouTube videos for educational purposes. All song content, including lyrics and translations, is provided for language learning.
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                Video content is provided by YouTube and is the property of their respective owners.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

