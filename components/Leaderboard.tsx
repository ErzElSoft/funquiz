
import React from 'react';
import { Player } from '../types';
import { Trophy, Medal, Crown } from 'lucide-react';

interface Props {
  players: Player[];
  onNext?: () => void;
  final?: boolean;
}

const Leaderboard: React.FC<Props> = ({ players, onNext, final = false }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const top5 = sortedPlayers.slice(0, 5);

  if (final) {
    const [first, second, third] = top5;

    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
        <h1 className="text-5xl md:text-7xl font-black mb-8 drop-shadow-lg text-white tracking-tight">
          The Podium
        </h1>

        <div className="flex-1 flex items-end justify-center w-full gap-4 md:gap-8 mb-12 min-h-[400px]">
          
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center w-1/3 md:w-1/4 animate-in slide-in-from-bottom duration-1000 delay-300">
              <div className="mb-4 text-center">
                <div className="text-2xl md:text-3xl font-bold truncate max-w-[150px]">{second.name}</div>
                <div className="text-xl opacity-80">{second.score} pts</div>
              </div>
              <div className="w-full h-48 md:h-64 bg-gray-300 rounded-t-lg shadow-2xl flex flex-col items-center justify-start pt-4 border-t-4 border-white/20 relative">
                 <div className="bg-gray-400/50 p-3 rounded-full mb-2">
                    <Medal className="w-8 h-8 md:w-12 md:h-12 text-gray-700" />
                 </div>
                 <span className="text-4xl md:text-6xl font-black text-gray-700/50">2</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {first && (
            <div className="flex flex-col items-center w-1/3 md:w-1/4 z-10 animate-in slide-in-from-bottom duration-1000">
              <div className="mb-4 text-center">
                <Crown className="w-12 h-12 text-yellow-300 mx-auto mb-2 animate-bounce" />
                <div className="text-3xl md:text-4xl font-black truncate max-w-[200px]">{first.name}</div>
                <div className="text-2xl font-bold text-yellow-300">{first.score} pts</div>
              </div>
              <div className="w-full h-64 md:h-80 bg-yellow-400 rounded-t-lg shadow-[0_0_50px_rgba(250,204,21,0.4)] flex flex-col items-center justify-start pt-6 border-t-4 border-white/20 relative">
                 <div className="bg-yellow-500/50 p-4 rounded-full mb-2">
                    <Trophy className="w-10 h-10 md:w-16 md:h-16 text-yellow-800" />
                 </div>
                 <span className="text-5xl md:text-7xl font-black text-yellow-800/50">1</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center w-1/3 md:w-1/4 animate-in slide-in-from-bottom duration-1000 delay-500">
              <div className="mb-4 text-center">
                <div className="text-2xl md:text-3xl font-bold truncate max-w-[150px]">{third.name}</div>
                <div className="text-xl opacity-80">{third.score} pts</div>
              </div>
              <div className="w-full h-32 md:h-48 bg-orange-700 rounded-t-lg shadow-2xl flex flex-col items-center justify-start pt-4 border-t-4 border-white/20 relative">
                 <div className="bg-orange-800/50 p-3 rounded-full mb-2">
                    <Medal className="w-8 h-8 md:w-12 md:h-12 text-orange-200" />
                 </div>
                 <span className="text-4xl md:text-6xl font-black text-orange-900/50">3</span>
              </div>
            </div>
          )}

        </div>

        {onNext && (
          <button
            onClick={onNext}
            className="bg-white text-[#46178f] px-12 py-4 rounded-full font-black text-2xl shadow-xl hover:scale-105 transition-transform"
          >
            Back to Menu
          </button>
        )}
      </div>
    );
  }

  // Standard Leaderboard
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4">
      <h1 className="text-5xl font-black mb-12 drop-shadow-md">
        Top 5
      </h1>

      <div className="w-full space-y-3 mb-12">
        {top5.map((player, idx) => (
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
          Next
        </button>
      )}
    </div>
  );
};

export default Leaderboard;
