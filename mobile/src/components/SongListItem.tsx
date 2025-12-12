import { TouchableOpacity, Text, Image, View, StyleSheet } from 'react-native';
import type { SongSummary } from '../types/song';

interface SongListItemProps {
  song: SongSummary;
  onPress: () => void;
}

export default function SongListItem({ song, onPress }: SongListItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl overflow-hidden"
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: song.thumbnailUrl }}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <View style={styles.playButtonContainer}>
          <View className="bg-primary rounded-full w-14 h-14 items-center justify-center" style={styles.playButton}>
            <Text className="text-white text-xl" style={styles.playIcon}>▶</Text>
          </View>
        </View>
      </View>
      <View className="p-4">
        <Text className="text-base font-semibold text-text-primary mb-1.5" numberOfLines={2} style={styles.title}>
          {song.title}
        </Text>
        <Text className="text-sm text-text-secondary" style={styles.artist}>
          {song.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 2,
  },
  title: {
    lineHeight: 22,
  },
  artist: {
    lineHeight: 18,
  },
});

