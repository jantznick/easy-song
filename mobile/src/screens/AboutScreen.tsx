import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

interface VersionItemProps {
  version: string;
  date: string;
  changes: string[];
}

function VersionItem({ version, date, changes }: VersionItemProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-text-primary">Version {version}</Text>
        <Text className="text-sm text-text-muted">{date}</Text>
      </View>
      <View className="bg-surface rounded-xl border border-border p-4">
        {changes.map((change, index) => (
          <View key={index} className="flex-row items-start mb-2">
            <Text className="text-primary mr-2 mt-1">•</Text>
            <Text className="text-sm text-text-secondary flex-1 leading-6">{change}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AboutScreen({ route }: Props) {
  const navigation = useNavigation();

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
        <Text className="text-lg font-semibold text-text-primary flex-1">About</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {/* App Info */}
          <View className="mb-6">
            <View className="bg-surface rounded-xl border border-border p-6 items-center">
              <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
                <Ionicons name="musical-notes" size={40} color="#6366F1" />
              </View>
              <Text className="text-2xl font-bold text-text-primary mb-2">Easy Song</Text>
              <Text className="text-base text-text-secondary mb-4">Version 1.0.0</Text>
              <Text className="text-sm text-text-secondary text-center leading-6">
                Learn Spanish through music. Watch videos, study lyrics, and improve your language skills with structured lessons.
              </Text>
            </View>
          </View>

          {/* Developer Studio Info */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-text-primary mb-4">Development Studio</Text>
            <View className="bg-surface rounded-xl border border-border p-5">
              <Text className="text-lg font-semibold text-text-primary mb-3">Your Studio Name</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-4">
                We're passionate about creating innovative language learning tools that make education engaging and accessible.
              </Text>
              <View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="mail" size={20} color="#6366F1" />
                  <Text className="text-sm text-text-primary ml-3">contact@yourstudio.com</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="globe" size={20} color="#6366F1" />
                  <Text className="text-sm text-text-primary ml-3">www.yourstudio.com</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="logo-twitter" size={20} color="#6366F1" />
                  <Text className="text-sm text-text-primary ml-3">@yourstudio</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Version History */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-text-primary mb-4">Version History</Text>
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
            <Text className="text-xl font-bold text-text-primary mb-4">Credits</Text>
            <View className="bg-surface rounded-xl border border-border p-5">
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                Easy Song uses YouTube videos for educational purposes. All song content, including lyrics and translations, is provided for language learning.
              </Text>
              <Text className="text-sm text-text-secondary leading-6">
                Video content is provided by YouTube and is the property of their respective owners.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

