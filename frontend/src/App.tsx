import { Routes, Route } from 'react-router-dom';
import SongListPage from './pages/SongListPage';
import SongPlayerPage from './pages/SongPlayerPage';
import SongStudyPage from './pages/SongStudyPage';
import './styles/index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SongListPage />} />
      <Route path="/songs/:videoId" element={<SongPlayerPage />} />
      <Route path="/songs/:videoId/study" element={<SongStudyPage />} />
    </Routes>
  );
}

export default App;
