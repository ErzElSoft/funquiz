import React from 'react';
import { Player } from '../types';
import { Trophy, Medal } from 'lucide-react';

interface Props {
  players: Player[];
  onNext?: () => void;
  final?: boolean;
}

const Leaderboard: React.FC<Props> = ({ players, onNext, final = false }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4">
      <h1 className="text-5xl font-black mb-12 drop-shadow-md">
        {final ? "Podium" : "Top 5"}
      </h1>

      <div className="w-full space-y-3 mb-12">
        {sortedPlayers.map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center bg-white text-gray-900 p-4 rounded shadow-lg transform transition-all animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="w-12 font-bold text-2xl text-gray-400">#{idx + 1}</div>
            <div className="flex-1 font-bold text-xl">{player.name}</div>
            <div className="font-black text-2xl text-[#46178f]">
              {player.score}
              {player.lastAnswerCorrect && (
                <span className="text-sm font-normal text-green-600 ml-2">🔥 +streak</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {onNext && (
        <button
          onClick={onNext}
          className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded font-bold backdrop-blur-sm border border-white/50 transition"
        >
          {final ? "Back to Menu" : "Next"}
        </button>
      )}
    </div>
  );
};

export default Leaderboard;