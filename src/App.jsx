import './index.css'
import Server from './pages/server';
import ServerList from './pages/serverList';
import { Route, Routes, Navigate } from 'react-router-dom';

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<ServerList />} />
        <Route path="/server/:serverId" element={<Server />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
  );
}

export default App;
