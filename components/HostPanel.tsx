import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Quiz, Player, HostStatePayload } from '../types';
import { Play, Users, Pencil, ArrowLeft, LogOut, BookOpen } from 'lucide-react';
import HostGameScreen from './HostGameScreen';
import HostResultsScreen from './HostResultsScreen';
import Leaderboard from './Leaderboard';
import QuizCreator from './QuizCreator';
import QuizLibrary from './QuizLibrary';
import Lobby from './Lobby';
import Footer from './Footer';
import { createGame, updateHostState, listenToPlayers, listenToAnswers, clearAnswers, checkGameExists, deleteGame } from '../services/gameService';
import { saveGameHistory } from '../services/gameHistoryService';
import { shuffleQuizQuestions } from '../utils/quizUtils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CHANNEL_NAME = 'genhoot_channel';
const HOST_SESSION_KEY = 'quiz_host_session';

interface HostSession {
  pin: string;
  quiz: Quiz;
  gameState: GameState;
  currentQuestionIndex: number;
  players: Player[];
  gameStartTime: number;
  currentQuizId?: string;
}

const HostPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [menuView, setMenuView] = useState<'SELECTION' | 'MANUAL_SETUP' | 'QUIZ_LIBRARY'>('SELECTION');
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [currentQuizId, setCurrentQuizId] = useState<string | undefined>(undefined);
  
  const [pin, setPin] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, { index?: number; text?: string }>>({});
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [restoringSession, setRestoringSession] = useState(true);

  // --- Restore Session on Mount ---
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(HOST_SESSION_KEY);
        if (savedSession) {
          const session: HostSession = JSON.parse(savedSession);
          
          // Check if the game still exists
          const gameExists = await checkGameExists(session.pin);
          
          if (gameExists) {
            // Restore session
            setPin(session.pin);
            setQuiz(session.quiz);
            setGameState(session.gameState);
            setCurrentQuestionIndex(session.currentQuestionIndex);
            setPlayers(session.players);
            setGameStartTime(session.gameStartTime || 0);
            setCurrentQuizId(session.currentQuizId);
            
            console.log('Host session restored successfully');
          } else {
            // Game no longer exists, clear session
            localStorage.removeItem(HOST_SESSION_KEY);
            console.log('Game no longer exists, session cleared');
          }
        }
      } catch (error) {
        console.error('Error restoring host session:', error);
        localStorage.removeItem(HOST_SESSION_KEY);
      } finally {
        setRestoringSession(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Session restoration timeout');
      setRestoringSession(false);
    }, 5000);

    restoreSession().then(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  // --- Save Session when game state changes ---
  useEffect(() => {
    if (gameState !== GameState.MENU && pin && quiz) {
      const session: HostSession = {
        pin,
        quiz,
        gameState,
        currentQuestionIndex,
        players,
        gameStartTime,
        currentQuizId
      };
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify(session));
    }
  }, [gameState, pin, quiz, currentQuestionIndex, players, gameStartTime, currentQuizId]);

  // --- Save game history and clear session on game end ---
  useEffect(() => {
    if (gameState === GameState.FINISH) {
      // Save game history when game finishes
      const saveHistory = async () => {
        if (user && quiz && gameStartTime && players.length > 0) {
          try {
            await saveGameHistory(user.uid, quiz, pin, players, gameStartTime, currentQuizId);
            console.log('Game history saved successfully on finish');
          } catch (error) {
            console.error('Error saving game history on finish:', error);
          }
        }
      };
      
      saveHistory();
      
      const timer = setTimeout(() => {
        localStorage.removeItem(HOST_SESSION_KEY);
        console.log('Host session cleared after game end');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, user, quiz, gameStartTime, players, pin, currentQuizId]);

  // --- Firebase Listeners ---
  useEffect(() => {
    if (pin && gameState === GameState.LOBBY) {
      const unsubscribePlayers = listenToPlayers(pin, (playersList) => {
        setPlayers(playersList);
      });
      
      return () => {
        unsubscribePlayers();
      };
    }
  }, [pin, gameState]);

  useEffect(() => {
    if (pin && gameState === GameState.QUESTION) {
      const unsubscribe = listenToAnswers(pin, (answers) => {
        const formattedAnswers: Record<string, { index?: number; text?: string; timeRemaining?: number }> = {};
        Object.entries(answers).forEach(([playerId, answer]: [string, any]) => {
          formattedAnswers[playerId] = {
            index: answer.answerIndex,
            text: answer.answerText,
            timeRemaining: answer.timeRemaining
          };
        });
        setCurrentAnswers(formattedAnswers);
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [pin, gameState]);

  // --- Broadcast Logic ---
  const broadcastState = useCallback(async (overrideState?: Partial<HostStatePayload>) => {
    if (!pin) return;
    
    const currentQ = quiz?.questions[currentQuestionIndex];
    
    const resultInfo = gameState === GameState.REVEAL && currentQ 
      ? { 
          correctIndex: currentQ.correctIndex, 
          correctText: currentQ.correctIndex === -1 ? currentQ.options[0] : null 
        } 
      : null;

    const payload: any = {
      pin,
      gameState: overrideState?.gameState || gameState,
      players: players.map(p => {
        const { lastAnswerCorrect, ...rest } = p;
        return rest;
      }),
      ...overrideState
    };

    // Only add optional fields if they have values
    if (timeLeft !== undefined && timeLeft !== null) {
      payload.timeLeft = timeLeft;
    }
    if (currentQ) {
      payload.currentQuestion = currentQ;
    }
    if (resultInfo) {
      payload.resultInfo = resultInfo;
    }

    console.log('Broadcasting state:', payload);
    await updateHostState(pin, payload);
  }, [pin, gameState, quiz, currentQuestionIndex, timeLeft, players]);

  useEffect(() => {
    if (gameState !== GameState.MENU) {
      broadcastState();
    }
  }, [gameState, players, timeLeft, currentQuestionIndex, broadcastState]);

  // --- Game Loop Handlers ---
  const handleManualQuizCreated = (createdQuiz: Quiz) => {
      // Shuffle questions for random order
      const shuffledQuiz = shuffleQuizQuestions(createdQuiz);
      setQuiz(shuffledQuiz);
      setCurrentQuizId(undefined);
      startLobby();
  };

  const handleLoadQuiz = (loadedQuiz: Quiz & { id?: string }) => {
    // Shuffle questions for random order
    const shuffledQuiz = shuffleQuizQuestions(loadedQuiz);
    setQuiz(shuffledQuiz);
    setCurrentQuizId(loadedQuiz.id);
    setMenuView('SELECTION');
    startLobby();
  };

  const startLobby = async () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);
    await createGame(newPin);
    setGameState(GameState.LOBBY);
    
    // Immediately broadcast lobby state
    setTimeout(() => {
      updateHostState(newPin, {
        pin: newPin,
        gameState: GameState.LOBBY,
        players: []
      });
    }, 100);
  };

  const startGame = () => {
    setGameStartTime(Date.now());
    setGameState(GameState.QUESTION);
    setCurrentQuestionIndex(0);
  };

  const onRoundFinished = () => {
    setGameState(GameState.REVEAL);
    const currentQ = quiz!.questions[currentQuestionIndex];
    const maxTime = currentQ.timeLimit;
    
    setPlayers(currentPlayers => currentPlayers.map(p => {
        const ans = currentAnswers[p.id];
        
        let isCorrect = false;
        let timeRemaining = 0;
        
        if (ans) {
            // Check if answer is correct
            if (currentQ.correctIndex !== -1) {
                isCorrect = ans.index === currentQ.correctIndex;
            } else {
                const correctText = currentQ.options[0].toLowerCase().trim();
                const playerText = (ans.text || "").toLowerCase().trim();
                isCorrect = correctText === playerText;
            }
            
            // Get time remaining (if available)
            timeRemaining = ans.timeRemaining || 0;
        }
        
        let scoreAdd = 0;
        if (isCorrect) {
            // Base points: 500
            // Time bonus: up to 500 points based on speed
            // Streak bonus: 100 per streak
            const basePoints = 500;
            const timeBonus = Math.round((timeRemaining / maxTime) * 500);
            const streakBonus = p.streak * 100;
            scoreAdd = basePoints + timeBonus + streakBonus;
        }

        return {
            ...p,
            score: p.score + scoreAdd,
            streak: isCorrect ? p.streak + 1 : 0,
            lastAnswerCorrect: isCorrect
        };
    }));
  };

  const nextQuestion = async () => {
    if (pin) {
      await clearAnswers(pin);
    }
    setCurrentAnswers({});
    if (gameState === GameState.REVEAL) {
      setGameState(GameState.LEADERBOARD);
    } else if (gameState === GameState.LEADERBOARD) {
      if (currentQuestionIndex < quiz!.questions.length - 1) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setGameState(GameState.QUESTION);
      } else {
        setGameState(GameState.FINISH);
      }
    }
  };

  const resetGame = async () => {
    // Save game history before resetting (only if game was in lobby and not finished)
    // If game finished naturally, history is already saved in the FINISH useEffect
    if (user && quiz && gameStartTime && players.length > 0 && gameState === GameState.LOBBY) {
      try {
        await saveGameHistory(user.uid, quiz, pin, players, gameStartTime, currentQuizId);
        console.log('Game history saved successfully on exit');
      } catch (error) {
        console.error('Error saving game history:', error);
      }
    }

    // Delete the game from Firebase to notify players
    if (pin) {
      try {
        await deleteGame(pin);
        console.log('Game deleted from Firebase');
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }

    localStorage.removeItem(HOST_SESSION_KEY);
    setGameState(GameState.MENU);
    setMenuView('SELECTION');
    setPlayers([]);
    setQuiz(null);
    setPin("");
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
    setGameStartTime(0);
    setCurrentQuizId(undefined);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const onAddFakePlayer = () => {
      // Stub for Lobby component if needed, though real players join via manual connection in this version
  };

  // --- Renders ---

  if (restoringSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white relative z-10" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center">
          <div className="animate-spin text-white/50 mb-4 inline-block">
            <svg className="w-12 h-12" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-xl font-bold">Restoring session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (gameState === GameState.MENU) {
    if (menuView === 'MANUAL_SETUP') {
        return <QuizCreator onSave={handleManualQuizCreated} onCancel={() => setMenuView('SELECTION')} />;
    }

    if (menuView === 'QUIZ_LIBRARY') {
        return <QuizLibrary onLoadQuiz={handleLoadQuiz} onBack={() => setMenuView('SELECTION')} />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white relative z-10">
        
        {menuView === 'SELECTION' && (
             <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-2xl w-full border border-white/20 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div className="text-sm opacity-70">
                    Logged in as: <span className="font-semibold">{user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
                <div className="text-center mb-12">
                     <h1 className="text-5xl font-semibold mb-4 tracking-tight">Host Dashboard</h1>
                     <p className="text-white/70 text-xl font-medium">Ready to challenge your players?</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    {/* Resume Game Button - Only show if there's a saved session */}
                    {(() => {
                      const savedSession = localStorage.getItem(HOST_SESSION_KEY);
                      if (savedSession) {
                        try {
                          const session = JSON.parse(savedSession);
                          return (
                            <button 
                              onClick={() => {
                                // Trigger session restoration
                                window.location.reload();
                              }}
                              className="group w-full bg-gradient-to-br from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-left p-8 rounded-2xl border border-white/10 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-green-500/50 hover:-translate-y-1 animate-pulse"
                            >
                              <div className="flex items-center gap-6">
                                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                  <Play className="w-10 h-10 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="text-3xl font-semibold mb-2">Resume Game</h3>
                                  <p className="text-green-100 group-hover:text-white text-lg leading-tight">
                                    Continue your active game: {session.quiz?.title || 'Quiz'} (PIN: {session.pin})
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        } catch (e) {
                          return null;
                        }
                      }
                      return null;
                    })()}

                    <button 
                        onClick={() => setMenuView('MANUAL_SETUP')}
                        className="group w-full bg-gradient-to-br from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 text-left p-8 rounded-2xl border border-white/10 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/50 hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-6">
                            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                <Pencil className="w-10 h-10 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-semibold mb-2">Create New Quiz</h3>
                                <p className="text-blue-100 group-hover:text-white text-lg leading-tight">Design custom questions, set timers, and host your game.</p>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={() => setMenuView('QUIZ_LIBRARY')}
                        className="group w-full bg-gradient-to-br from-green-600/80 to-teal-600/80 hover:from-green-600 hover:to-teal-600 text-left p-8 rounded-2xl border border-white/10 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-green-500/50 hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-6">
                            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                <BookOpen className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-semibold mb-2">My Quiz Library</h3>
                                <p className="text-green-100 group-hover:text-white text-lg leading-tight">Load and host your saved quizzes.</p>
                            </div>
                        </div>
                    </button>
                </div>
             </div>
        )}

        <Footer />
      </div>
    );
  }

  if (gameState === GameState.LOBBY) {
      return (
          <Lobby 
            pin={pin} 
            players={players} 
            onStart={startGame} 
            onAddFakePlayer={onAddFakePlayer}
            onBack={() => {
              // Return to dashboard but keep session active
              // Session is already saved in localStorage via useEffect
              setRestoringSession(true);
              setTimeout(() => {
                setGameState(GameState.MENU);
                setMenuView('SELECTION');
                setRestoringSession(false);
              }, 100);
            }}
            onExit={() => {
              // Completely exit and clear the game
              resetGame();
            }}
          />
      );
  }

  const answerCount = Object.keys(currentAnswers).length;

  return (
    <div className="h-screen flex flex-col relative z-10 pb-16">
       <header className="px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm border-b border-white/5">
         <span className="font-bold text-lg opacity-80">{quiz?.title}</span>
         <div className="flex items-center gap-2">
             <span className="text-sm font-bold opacity-60 uppercase">Game PIN:</span>
             <span className="font-black text-xl bg-white text-[#46178f] px-3 py-1 rounded shadow">{pin}</span>
         </div>
       </header>

       <main className="flex-1 relative overflow-hidden flex flex-col">
          {gameState === GameState.QUESTION && quiz && (
             <HostGameScreen 
                question={quiz.questions[currentQuestionIndex]}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={quiz.questions.length}
                answersCount={answerCount}
                onTimerEnd={onRoundFinished}
                onTimerTick={(time) => setTimeLeft(time)}
             />
          )}

          {gameState === GameState.REVEAL && quiz && (
              <HostResultsScreen
                 question={quiz.questions[currentQuestionIndex]}
                 answers={currentAnswers as any}
                 onNext={nextQuestion}
                 isLast={currentQuestionIndex === quiz.questions.length - 1}
              />
          )}

          {(gameState === GameState.LEADERBOARD || gameState === GameState.FINISH) && (
              <Leaderboard 
                  players={players} 
                  onNext={gameState === GameState.FINISH ? resetGame : nextQuestion}
                  final={gameState === GameState.FINISH}
              />
          )}
       </main>
       <Footer />
    </div>
  );
};

export default HostPanel;