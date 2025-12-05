import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Quiz, Player, HostStatePayload } from '../types';
import { Play, Users, Pencil, ArrowLeft } from 'lucide-react';
import HostGameScreen from './HostGameScreen';
import HostResultsScreen from './HostResultsScreen';
import Leaderboard from './Leaderboard';
import QuizCreator from './QuizCreator';
import Lobby from './Lobby';
import Footer from './Footer';
import { createGame, updateHostState, listenToPlayers, listenToAnswers, clearAnswers } from '../services/gameService';

const CHANNEL_NAME = 'genhoot_channel';

const HostPanel: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [menuView, setMenuView] = useState<'SELECTION' | 'MANUAL_SETUP'>('SELECTION');
  
  const [pin, setPin] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, { index?: number; text?: string }>>({});
  
  const [timeLeft, setTimeLeft] = useState(0);

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
      setQuiz(createdQuiz);
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

  const resetGame = () => {
    setGameState(GameState.MENU);
    setMenuView('SELECTION');
    setPlayers([]);
    setQuiz(null);
    setPin("");
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
  };

  const onAddFakePlayer = () => {
      // Stub for Lobby component if needed, though real players join via manual connection in this version
  };

  // --- Renders ---

  if (gameState === GameState.MENU) {
    if (menuView === 'MANUAL_SETUP') {
        return <QuizCreator onSave={handleManualQuizCreated} onCancel={() => setMenuView('SELECTION')} />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white relative z-10">
        
        {menuView === 'SELECTION' && (
             <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-2xl w-full border border-white/20 animate-in zoom-in duration-300">
                <div className="text-center mb-12">
                     <h1 className="text-5xl font-semibold mb-4 tracking-tight">Host Dashboard</h1>
                     <p className="text-white/70 text-xl font-medium">Ready to challenge your players?</p>
                </div>
                
                <div className="flex justify-center">
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