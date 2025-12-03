import React from 'react';
import { Player } from '../types';
import { Users, Play, Music } from 'lucide-react';

interface Props {
  pin: string;
  players: Player[];
  onStart: () => void;
  onAddFakePlayer: () => void;
}

const Lobby: React.FC<Props> = ({ pin, players, onStart }) => {
  return (
    <div className="flex flex-col h-screen w-full p-8 relative z-10">
      
      {/* Header Info */}
      <div className="flex justify-center items-center mb-12 relative">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center shadow-2xl animate-in slide-in-from-top">
          <p className="text-xl font-bold opacity-80 mb-2 uppercase tracking-widest">Game PIN</p>
          <div className="bg-white text-[#46178f] px-8 py-2 rounded-xl inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
             <p className="text-7xl font-black tracking-widest drop-shadow-sm">{pin}</p>
          </div>
        </div>
        
        <div className="absolute right-0 bg-black/20 backdrop-blur-md px-8 py-4 rounded-2xl flex items-center gap-4 border border-white/10 animate-in slide-in-from-right">
          <Users className="w-8 h-8 opacity-80" />
          <span className="text-4xl font-black">{players.length}</span>
        </div>
      </div>

      {/* Players Grid */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="flex flex-wrap gap-4 content-start h-full p-4 overflow-y-auto">
          {players.map((player, idx) => {
             // Generate random aesthetic for player card
             const rotations = ['rotate-1', '-rotate-2', 'rotate-3', '-rotate-1'];
             const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
             const randomRotate = rotations[idx % rotations.length];
             const randomColor = colors[idx % colors.length];

             const isCustomPhoto = player.avatar?.startsWith('data:image');
             
             return (
                <div
                key={player.id}
                className={`${randomColor} text-white font-black px-6 py-4 rounded-xl shadow-lg transform ${randomRotate} hover:scale-110 hover:z-10 hover:rotate-0 transition-all duration-300 animate-in zoom-in flex items-center gap-3 border-2 border-white/20`}
                style={{ animationDelay: `${idx * 100}ms` }}
                >
                {player.avatar && (
                  isCustomPhoto ? (
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/50" />
                  ) : (
                    <span className="text-3xl">{player.avatar}</span>
                  )
                )}
                <span className="text-xl text-shadow">{player.name}</span>
                <div className="bg-black/20 px-2 py-1 rounded text-sm font-bold">
                    {player.score}
                </div>
                </div>
             );
          })}
          
          {players.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 animate-pulse">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                 <Music className="w-10 h-10" />
              </div>
              <p className="text-3xl font-black">Waiting for players...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="w-full flex justify-between items-center mt-6">
         <div className="text-sm font-bold opacity-50">Waiting for host to start...</div>
         <button
          onClick={onStart}
          disabled={players.length === 0}
          className={`px-12 py-5 rounded-full text-2xl font-black shadow-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 ${
            players.length > 0
              ? 'bg-white text-[#46178f] hover:shadow-white/20 cursor-pointer'
              : 'bg-black/20 text-white/20 cursor-not-allowed'
          }`}
        >
          Start Game <Play className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default Lobby;