export interface SongHistoryItem {
  song: string;
  artist: string;
  mode: 'Play Mode' | 'Study Mode';
  date: string;
  time: string;
  videoId: string;
}

// Dummy data - in production, this would come from your backend/storage
// All songs use the badbunny video ID for now
const BADBUNNY_VIDEO_ID = 'KU5V5WZVcVE';

export const ALL_SONG_HISTORY: SongHistoryItem[] = [
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Play Mode', date: 'Jan 15, 2025', time: '2:34 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Study Mode', date: 'Jan 14, 2025', time: '4:12 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Play Mode', date: 'Jan 13, 2025', time: '11:20 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Study Mode', date: 'Jan 12, 2025', time: '3:45 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Play Mode', date: 'Jan 11, 2025', time: '9:15 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Play Mode', date: 'Jan 10, 2025', time: '6:30 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Study Mode', date: 'Jan 9, 2025', time: '1:22 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Play Mode', date: 'Jan 8, 2025', time: '10:45 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Study Mode', date: 'Jan 7, 2025', time: '5:20 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Play Mode', date: 'Jan 6, 2025', time: '3:10 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Study Mode', date: 'Jan 5, 2025', time: '11:30 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Play Mode', date: 'Jan 4, 2025', time: '8:15 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Play Mode', date: 'Jan 3, 2025', time: '7:45 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Study Mode', date: 'Jan 2, 2025', time: '2:00 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Play Mode', date: 'Jan 1, 2025', time: '12:30 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Play Mode', date: 'Dec 31, 2024', time: '9:20 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Study Mode', date: 'Dec 30, 2024', time: '4:50 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Play Mode', date: 'Dec 29, 2024', time: '1:15 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Play Mode', date: 'Dec 28, 2024', time: '6:40 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Study Mode', date: 'Dec 27, 2024', time: '3:25 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Play Mode', date: 'Dec 26, 2024', time: '10:10 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Play Mode', date: 'Dec 25, 2024', time: '5:55 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Study Mode', date: 'Dec 24, 2024', time: '12:00 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Play Mode', date: 'Dec 23, 2024', time: '8:30 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Play Mode', date: 'Dec 22, 2024', time: '4:15 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Study Mode', date: 'Dec 21, 2024', time: '11:45 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Play Mode', date: 'Dec 20, 2024', time: '7:20 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Play Mode', date: 'Dec 19, 2024', time: '2:50 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Study Mode', date: 'Dec 18, 2024', time: '9:35 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Play Mode', date: 'Dec 17, 2024', time: '6:10 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Play Mode', date: 'Dec 16, 2024', time: '1:40 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Sofia', artist: 'Alvaro Soler', mode: 'Study Mode', date: 'Dec 15, 2024', time: '10:25 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira', mode: 'Play Mode', date: 'Dec 14, 2024', time: '5:00 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Mi Gente', artist: 'J Balvin', mode: 'Play Mode', date: 'Dec 13, 2024', time: '12:15 PM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Despacito', artist: 'Luis Fonsi', mode: 'Study Mode', date: 'Dec 12, 2024', time: '8:50 AM', videoId: BADBUNNY_VIDEO_ID },
  { song: 'Bailando', artist: 'Enrique Iglesias', mode: 'Play Mode', date: 'Dec 11, 2024', time: '3:30 PM', videoId: BADBUNNY_VIDEO_ID },
];

