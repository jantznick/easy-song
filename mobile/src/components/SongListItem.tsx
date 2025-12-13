import { TouchableOpacity, Text, Image, View } from 'react-native';
import type { SongSummary } from '../types/song';
import { useThemeClasses } from '../utils/themeClasses';

interface SongListItemProps {
  song: SongSummary;
  onPress: () => void;
}

export default function SongListItem({ song, onPress }: SongListItemProps) {
  const theme = useThemeClasses();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-2xl overflow-hidden border'}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="relative w-full" style={{ height: 160 }}>
        <Image
          source={{ uri: song.thumbnailUrl }}
          className="w-full"
          style={{ height: 160 }}
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/30" />
        <View className="absolute top-1/2 left-1/2" style={{ marginLeft: -28, marginTop: -28 }}>
          <View 
            className="w-14 h-14 rounded-full items-center justify-center bg-primary"
            style={{
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-xl" style={{ marginLeft: 2 }}>▶</Text>
          </View>
        </View>
      </View>
      <View className="p-4">
        <Text numberOfLines={2} className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-1.5 leading-[22px]'}>
          {song.title}
        </Text>
        <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-[18px]'}>
          {song.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

