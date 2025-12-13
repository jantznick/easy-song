import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

export default function HelpScreen({ route }: Props) {
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
        <Text className="text-lg font-semibold text-text-primary flex-1">Help & Support</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {/* Getting Started */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-text-primary mb-4">Getting Started</Text>
            <View className="bg-surface rounded-xl border border-border p-5">
              <Text className="text-base text-text-primary mb-3 font-semibold">How to use the app</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-4">
                Easy Song helps you learn Spanish through music. Browse songs, watch videos, and study lyrics with translations and explanations.
              </Text>
              <Text className="text-base text-text-primary mb-3 font-semibold">Play Mode</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-4">
                Watch the video and follow along with highlighted lyrics. Tap any lyric to jump to that part of the song. Toggle translations on or off as needed.
              </Text>
              <Text className="text-base text-text-primary mb-3 font-semibold">Study Mode</Text>
              <Text className="text-sm text-text-secondary leading-6">
                Dive deeper into each song with structured sections. Each section includes explanations, line-by-line playback, and detailed translations.
              </Text>
            </View>
          </View>

          {/* Frequently Asked Questions */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-text-primary mb-4">Frequently Asked Questions</Text>
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              <View className="p-5 border-b border-border">
                <Text className="text-base text-text-primary mb-2 font-semibold">How do I change the language?</Text>
                <Text className="text-sm text-text-secondary leading-6">
                  Go to Settings → Language to change your learning language or interface language.
                </Text>
              </View>
              <View className="p-5 border-b border-border">
                <Text className="text-base text-text-primary mb-2 font-semibold">Can I download songs for offline use?</Text>
                <Text className="text-sm text-text-secondary leading-6">
                  Currently, songs require an internet connection to play. Offline functionality may be available in future updates.
                </Text>
              </View>
              <View className="p-5 border-b border-border">
                <Text className="text-base text-text-primary mb-2 font-semibold">How do I save my progress?</Text>
                <Text className="text-sm text-text-secondary leading-6">
                  Sign in to your account to sync your progress across devices. Your learning history and preferences will be saved automatically.
                </Text>
              </View>
              <View className="p-5">
                <Text className="text-base text-text-primary mb-2 font-semibold">The video isn't playing</Text>
                <Text className="text-sm text-text-secondary leading-6">
                  Make sure you have a stable internet connection. If the issue persists, try closing and reopening the app, or restarting your device.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Support */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-text-primary mb-4">Contact Support</Text>
            <View className="bg-surface rounded-xl border border-border p-5">
              <Text className="text-sm text-text-secondary leading-6 mb-4">
                Need more help? Our support team is here to assist you.
              </Text>
              <View className="flex-row items-center mb-3">
                <Ionicons name="mail" size={20} color="#6366F1" />
                <Text className="text-sm text-text-primary ml-3">support@easysong.com</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={20} color="#6366F1" />
                <Text className="text-sm text-text-primary ml-3">Response time: 24-48 hours</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


