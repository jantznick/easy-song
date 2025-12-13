import { View, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { forwardRef, type Ref } from 'react';
import { useUser } from '../hooks/useUser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

interface VideoPlayerProps {
  videoId: string;
  play: boolean;
  onChangeState?: (event: string) => void;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(({ videoId, play, onChangeState }, ref: Ref<any>) => {
  const { preferences } = useUser();

  // Wrap onChangeState to handle looping when enabled
  const handleStateChange = (state: string) => {
    // If loop is enabled and video ended, seek back to start and continue playing
    if (preferences.playback.loop && state === 'ended') {
      try {
        // Access the ref's current value (ref is forwarded from parent)
        const playerRef = ref as any;
        if (playerRef?.current?.seekTo) {
          playerRef.current.seekTo(0, true);
          // Small delay to ensure seek completes, then trigger play
          setTimeout(() => {
            if (playerRef?.current?.playVideo) {
              playerRef.current.playVideo();
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error looping video:', error);
      }
      // Don't pass 'ended' to parent when looping - keep it playing
      // Instead, pass 'playing' to indicate it's continuing
      if (onChangeState) {
        onChangeState('playing');
      }
      return;
    }
    
    // Call the original onChangeState if provided
    if (onChangeState) {
      onChangeState(state);
    }
  };

  return (
    <View>
      <View className="bg-black" style={{ height: VIDEO_HEIGHT }}>
        <YoutubePlayer
          ref={ref as any}
          height={VIDEO_HEIGHT}
          width={SCREEN_WIDTH}
          videoId={videoId}
          play={play}
          onChangeState={handleStateChange}
        />
      </View>
    </View>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

