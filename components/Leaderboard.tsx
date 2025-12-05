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
      <div className="flex flex-col items-center justify-center h-full w-full max-w-6xl mx-auto p-6 pt-16 pb-24 animate-in fade-in duration-700 relative z-10">
        <h1 className="text-3xl md:text-5xl font-black mb-12 drop-shadow-xl text-white tracking-tight uppercase">
          The Podium
        </h1>

        <div className="flex items-end justify-center w-full gap-4 md:gap-8 mb-8">
          
          {/* 2nd Place */}
          <div className="flex flex-col items-center w-1/3 md:w-1/4 animate-in slide-in-from-bottom duration-1000 delay-300 order-1">
            {second && (
             <>
              <div className="mb-4 text-center animate-in fade-in delay-700">
                <div className="text-2xl md:text-3xl font-bold truncate max-w-[150px] text-shadow">{second.name}</div>
                <div className="text-xl opacity-80 font-mono">{second.score} pts</div>
              </div>
              <div className="w-full h-40 md:h-52 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-xl shadow-2xl flex flex-col items-center justify-start pt-4 border-t-4 border-white/30 relative">
                 <div className="bg-black/20 p-3 rounded-full mb-2">
                    <Medal className="w-8 h-8 md:w-12 md:h-12 text-white" />
                 </div>
                 <span className="text-6xl font-black text-black/10 absolute bottom-4">2</span>
              </div>
             </>
            )}
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center w-1/3 md:w-1/4 z-10 animate-in slide-in-from-bottom duration-1000 order-2">
            {first && (
             <>
              <div className="mb-4 text-center animate-in fade-in delay-500">
                <Crown className="w-12 h-12 text-yellow-300 mx-auto mb-2 animate-bounce drop-shadow-lg" />
                <div className="text-3xl md:text-4xl font-black truncate max-w-[200px] text-shadow">{first.name}</div>
                <div className="text-2xl font-bold text-yellow-300 font-mono">{first.score} pts</div>
              </div>
              <div className="w-full h-52 md:h-64 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-xl shadow-[0_0_50px_rgba(250,204,21,0.4)] flex flex-col items-center justify-start pt-6 border-t-4 border-white/30 relative">
                 <div className="bg-black/20 p-4 rounded-full mb-2">
                    <Trophy className="w-10 h-10 md:w-16 md:h-16 text-white" />
                 </div>
                 <span className="text-7xl font-black text-black/10 absolute bottom-4">1</span>
              </div>
             </>
            )}
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center w-1/3 md:w-1/4 animate-in slide-in-from-bottom duration-1000 delay-500 order-3">
            {third && (
             <>
              <div className="mb-4 text-center animate-in fade-in delay-1000">
                <div className="text-2xl md:text-3xl font-bold truncate max-w-[150px] text-shadow">{third.name}</div>
                <div className="text-xl opacity-80 font-mono">{third.score} pts</div>
              </div>
              <div className="w-full h-28 md:h-40 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-xl shadow-2xl flex flex-col items-center justify-start pt-4 border-t-4 border-white/30 relative">
                 <div className="bg-black/20 p-3 rounded-full mb-2">
                    <Medal className="w-8 h-8 md:w-12 md:h-12 text-white" />
                 </div>
                 <span className="text-6xl font-black text-black/10 absolute bottom-4">3</span>
              </div>
             </>
            )}
          </div>

        </div>

        {onNext && (
          <button
            onClick={onNext}
            className="bg-white text-[#46178f] px-12 py-5 rounded-full font-black text-2xl shadow-2xl hover:scale-105 transition-transform border-4 border-transparent hover:border-purple-300"
          >
            Back to Menu
          </button>
        )}
      </div>
    );
  }

  // Standard Leaderboard
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 pb-20 relative z-10">
      <div className="bg-black/20 backdrop-blur-md px-12 py-4 rounded-2xl mb-12 shadow-xl border border-white/10">
        <h1 className="text-5xl font-black drop-shadow-md uppercase tracking-wide">
          Top 5
        </h1>
      </div>

      <div className="w-full space-y-3 mb-12">
        {top5.map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center bg-white text-gray-900 p-5 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] animate-in slide-in-from-bottom duration-500 border-b-4 border-gray-200"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="w-16 font-semibold text-3xl text-[#46178f]">#{idx + 1}</div>
            <div className="flex-1 font-bold text-2xl text-[#46178f]">{player.name}</div>
            <div className="font-black text-2xl text-gray-800">
              {player.score}
              {player.lastAnswerCorrect && (
                <span className="text-sm font-bold bg-green-100 text-green-600 px-2 py-1 rounded ml-3 align-middle">🔥 +{player.streak}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {onNext && (
        <button
          onClick={onNext}
          className="bg-white hover:bg-gray-100 text-[#46178f] px-10 py-4 rounded-full font-black text-xl shadow-xl transition-all hover:-translate-y-1"
        >
          Next Question
        </button>
      )}
    </div>
  );
};

export default Leaderboard;