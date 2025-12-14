import type { SongSummary } from './song';

export type RootStackParamList = {
  Onboarding: undefined;
  SongList: undefined;
  SongDetail: { videoId: string; initialTab?: 'PlayMode' | 'StudyMode' };
  Settings: { videoId?: string };
  UserProfileSettings: undefined;
  Help: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
  SongHistory: undefined;
};

export type SongDetailTabParamList = {
  PlayMode: { videoId: string };
  StudyMode: { videoId: string };
  Settings: { videoId: string };
};

