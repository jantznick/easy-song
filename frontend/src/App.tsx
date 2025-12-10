import { Routes, Route } from 'react-router-dom';
import SongListPage from './pages/SongListPage';
import SongPlayerPage from './pages/SongPlayerPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SongListPage />} />
      <Route path="/songs/:videoId" element={<SongPlayerPage />} />
    </Routes>
  );
}

export default App;
