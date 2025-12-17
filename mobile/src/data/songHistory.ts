export interface SongHistoryItem {
  id?: string;
  song: string;
  artist: string;
  mode: 'Play Mode' | 'Study Mode';
  date: string;
  time: string;
  videoId: string;
}

