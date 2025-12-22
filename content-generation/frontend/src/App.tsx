import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SongDetail from './pages/SongDetail';
import Logs from './pages/Logs';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/song/:videoId" element={<SongDetail />} />
      <Route path="/logs" element={<Logs />} />
    </Routes>
  );
}

export default App;

