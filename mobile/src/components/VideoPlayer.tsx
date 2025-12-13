import { View, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { forwardRef } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

interface VideoPlayerProps {
  videoId: string;
  play: boolean;
  onChangeState?: (event: string) => void;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(({ videoId, play, onChangeState }, ref) => {
  return (
    <View>
      <View className="bg-black" style={{ height: VIDEO_HEIGHT }}>
        <YoutubePlayer
          ref={ref}
          height={VIDEO_HEIGHT}
          width={SCREEN_WIDTH}
          videoId={videoId}
          play={play}
          onChangeState={onChangeState}
        />
      </View>
    </View>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

