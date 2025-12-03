import React, { useEffect } from 'react';
import { Player } from '../types';
import { Users, Play } from 'lucide-react';

interface Props {
  pin: string;
  players: Player[];
  onStart: () => void;
  onAddFakePlayer: () => void;
}

const Lobby: React.FC<Props> = ({ pin, players, onStart, onAddFakePlayer }) => {
  // Simulate players joining automatically for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      if (players.length < 8) {
        onAddFakePlayer();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [players.length, onAddFakePlayer]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-start mb-8">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg text-center shadow-xl border border-white/20">
          <p className="text-xl font-semibold opacity-80 mb-1">Join with PIN:</p>
          <p className="text-6xl font-black tracking-widest text-white drop-shadow-lg">{pin}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg flex items-center gap-4 border border-white/20">
          <Users className="w-8 h-8" />
          <span className="text-3xl font-bold">{players.length}</span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <div className="flex flex-wrap gap-4 justify-center content-start h-full p-4 overflow-y-auto">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white text-[#46178f] font-bold px-6 py-3 rounded shadow-lg transform transition hover:scale-105 animate-in zoom-in duration-300 flex items-center gap-3"
            >
              <span>{player.name}</span>
              <div className="bg-gray-100 px-2 py-1 rounded text-sm text-[#46178f]/80">
                {player.score} pts
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-2xl opacity-50 font-semibold mt-20 animate-pulse">
              Waiting for players...
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex justify-end mt-8">
        <button
          onClick={onStart}
          disabled={players.length === 0}
          className={`px-12 py-4 rounded-full text-2xl font-bold shadow-2xl flex items-center gap-3 transition-all ${
            players.length > 0
              ? 'bg-white text-[#46178f] hover:bg-gray-100 hover:scale-105 cursor-pointer'
              : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
          }`}
        >
          Start <Play className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default Lobby;