import type { SongSummary } from './song';

export type RootStackParamList = {
  SongList: undefined;
  SongDetail: { videoId: string };
};

export type SongDetailTabParamList = {
  PlayMode: { videoId: string };
  StudyMode: { videoId: string };
  Settings: { videoId: string };
};

