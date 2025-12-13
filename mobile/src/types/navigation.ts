import type { SongSummary } from './song';

export type RootStackParamList = {
  SongList: undefined;
  SongDetail: { videoId: string };
  UserProfileSettings: undefined;
  Help: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

export type SongDetailTabParamList = {
  PlayMode: { videoId: string };
  StudyMode: { videoId: string };
  Settings: { videoId: string };
};

