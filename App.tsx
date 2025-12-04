import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import HostPanel from './components/HostPanel';
import PlayerPanel from './components/PlayerPanel';

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/quiz">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostPanel />} />
        <Route path="/join" element={<PlayerPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
