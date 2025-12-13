import { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { ALL_SONG_HISTORY, type SongHistoryItem } from '../data/songHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'SongHistory'>;

const ITEMS_PER_PAGE = 20;

export default function SongHistoryScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(ALL_SONG_HISTORY.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = useMemo(
    () => ALL_SONG_HISTORY.slice(startIndex, endIndex),
    [startIndex, endIndex]
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
        <Text className="text-lg font-semibold text-text-primary flex-1">Song History</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Song History List */}
        <View className="bg-surface rounded-xl border border-border overflow-hidden">
          {currentItems.map((item, index, array) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              className={`flex-row items-center py-4 px-5 ${
                index < array.length - 1 ? 'border-b border-border' : ''
              }`}
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
        </View>
      </ScrollView>

      {/* Pagination Controls - Fixed at Bottom */}
      <View className="bg-surface border-t border-border px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentPage === 1}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-surface/50 border border-border'
                : 'bg-surface border border-border'
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentPage === 1 ? '#64748B' : '#94A3B8'}
            />
            <Text
              className={`ml-2 text-sm font-medium ${
                currentPage === 1 ? 'text-text-muted' : 'text-text-primary'
              }`}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <Text className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentPage === totalPages}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-surface/50 border border-border'
                : 'bg-surface border border-border'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`mr-2 text-sm font-medium ${
                currentPage === totalPages ? 'text-text-muted' : 'text-text-primary'
              }`}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentPage === totalPages ? '#64748B' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

