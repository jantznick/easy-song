import { View, Text, SafeAreaView } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { SongDetailTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<SongDetailTabParamList, 'StudyMode'>;

export default function StudyModeScreen({ route }: Props) {
  const { videoId } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold text-text-primary mb-2">Study Mode</Text>
        <Text className="text-text-secondary text-center">
          Study mode content will be displayed here
        </Text>
        <Text className="text-text-muted text-sm mt-2">
          Video ID: {videoId}
        </Text>
      </View>
    </SafeAreaView>
  );
}

