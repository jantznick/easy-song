import { View, Text, ActivityIndicator, SafeAreaView } from 'react-native';

interface StatusDisplayProps {
  error?: string | null;
  loading?: boolean;
  loadingText?: string;
}

export default function StatusDisplay({ error, loading, loadingText = 'Loading...' }: StatusDisplayProps) {
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-400 text-center mb-2 text-lg font-semibold">Error</Text>
          <Text className="text-text-secondary text-center text-base">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-text-secondary text-base">{loadingText}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

