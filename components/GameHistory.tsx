import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGameHistory, GameHistory as GameHistoryType } from '../services/gameHistoryService';
import { ArrowLeft, Trophy, Users, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateGameDuration } from '../utils/quizUtils';

interface GameHistoryProps {
  onBack: () => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const gameHistory = await getGameHistory(user.uid);
      setHistory(gameHistory);
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="text-2xl">Loading game history...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 text-white relative z-10">
      <div className="max-w-6xl w-full mx-auto">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold">Game History</h1>
            <div className="w-24"></div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-white/70 mb-4">No game history yet.</p>
              <p className="text-white/50">Host a quiz to see your game reports here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((game) => (
                <div
                  key={game.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-200"
                >
                  {/* Game Summary */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleExpand(game.id!)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{game.quizTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {game.endedAt.toLocaleDateString()} at {game.endedAt.toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {calculateGameDuration(game.startedAt.getTime(), game.endedAt.getTime())}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-white/70 mb-1">
                          <Users className="w-4 h-4" />
                          <span>{game.totalPlayers} Players</span>
                        </div>
                        <div className="text-xs text-white/50">PIN: {game.gamePin}</div>
                      </div>
                    </div>

                    {/* Top 3 Players Preview */}
                    <div className="flex items-center gap-3 mb-4">
                      {game.players.slice(0, 3).map((player, idx) => (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            idx === 0 ? 'bg-yellow-500/20' : idx === 1 ? 'bg-gray-400/20' : 'bg-orange-600/20'
                          }`}
                        >
                          {player.avatar.startsWith('data:') ? (
                            <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xl">{player.avatar}</span>
                          )}
                          <span className="font-semibold">{player.name}</span>
                          <span className="text-sm text-white/70">{player.score}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center text-white/50">
                      {expandedGame === game.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedGame === game.id && (
                    <div className="border-t border-white/10 p-6 bg-black/20">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Final Rankings
                      </h4>
                      <div className="space-y-2">
                        {game.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  player.rank === 1
                                    ? 'bg-yellow-500 text-black'
                                    : player.rank === 2
                                    ? 'bg-gray-400 text-black'
                                    : player.rank === 3
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                {player.rank}
                              </div>
                              {player.avatar.startsWith('data:') ? (
                                <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full" />
                              ) : (
                                <span className="text-2xl">{player.avatar}</span>
                              )}
                              <div>
                                <div className="font-bold">{player.name}</div>
                                <div className="text-sm text-white/50">
                                  {player.correctAnswers}/{player.totalAnswers} correct
                                </div>
                              </div>
                            </div>
                            <div className="text-2xl font-bold">{player.score}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHistory;
