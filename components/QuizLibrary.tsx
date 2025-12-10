import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getQuizzes, deleteQuiz } from '../services/quizService';
import { getQuizHistory, GameHistory } from '../services/gameHistoryService';
import { Quiz } from '../types';
import { Trash2, Play, ArrowLeft, Search, History, Trophy, Users, Calendar, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { calculateGameDuration } from '../utils/quizUtils';

interface SavedQuiz extends Quiz {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuizLibraryProps {
  onLoadQuiz: (quiz: Quiz) => void;
  onBack: () => void;
}

const QuizLibrary: React.FC<QuizLibraryProps> = ({ onLoadQuiz, onBack }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [quizHistory, setQuizHistory] = useState<GameHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedQuizzes = await getQuizzes(user.uid);
      setQuizzes(fetchedQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!user) return;
    
    try {
      await deleteQuiz(user.uid, quizId);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleViewHistory = async (quizId: string) => {
    if (!user) return;
    
    setViewingHistory(quizId);
    setLoadingHistory(true);
    try {
      const history = await getQuizHistory(user.uid, quizId);
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleExpand = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="text-2xl">Loading your quizzes...</div>
      </div>
    );
  }

  // Show history view for a specific quiz
  if (viewingHistory) {
    const quiz = quizzes.find(q => q.id === viewingHistory);
    
    return (
      <div className="flex flex-col min-h-screen p-4 text-white relative z-10">
        <div className="max-w-6xl w-full mx-auto">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setViewingHistory(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Quizzes</span>
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-bold">{quiz?.title}</h1>
                <p className="text-white/70">Game History</p>
              </div>
              <div className="w-32"></div>
            </div>

            {loadingHistory ? (
              <div className="text-center py-16">
                <div className="text-xl">Loading history...</div>
              </div>
            ) : quizHistory.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-white/70 mb-4">No games played yet.</p>
                <p className="text-white/50">Host this quiz to see game reports here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizHistory.map((game) => (
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
            <h1 className="text-4xl font-bold">My Quizzes</h1>
            <div className="w-24"></div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-white/70 mb-4">
                {searchTerm ? 'No quizzes found matching your search.' : 'No saved quizzes yet.'}
              </p>
              <p className="text-white/50">
                {!searchTerm && 'Create your first quiz to get started!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200"
                >
                  <h3 className="text-xl font-bold mb-2 truncate">{quiz.title}</h3>
                  <p className="text-white/70 text-sm mb-1">Topic: {quiz.topic}</p>
                  <p className="text-white/70 text-sm mb-4">
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-white/50 text-xs mb-4">
                    Created: {quiz.createdAt.toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadQuiz(quiz)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200"
                    >
                      <Play className="w-4 h-4" />
                      <span>Load</span>
                    </button>
                    
                    <button
                      onClick={() => handleViewHistory(quiz.id)}
                      className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg transition-all duration-200"
                      title="View game history"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    
                    {deleteConfirm === quiz.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(quiz.id)}
                        className="px-3 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizLibrary;
