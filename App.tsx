import React, { useState } from 'react';
import Landing from './components/Landing';
import HostPanel from './components/HostPanel';
import PlayerPanel from './components/PlayerPanel';

const App: React.FC = () => {
  const [mode, setMode] = useState<'LANDING' | 'HOST' | 'PLAYER'>('LANDING');

  if (mode === 'HOST') {
    return <HostPanel />;
  }

  if (mode === 'PLAYER') {
    return <PlayerPanel />;
  }

  return <Landing onSelectMode={setMode} />;
};

export default App;
