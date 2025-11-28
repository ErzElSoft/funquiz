
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Quiz, Player, ChannelMessage, HostStatePayload, Question } from '../types';
import { generateQuizFromTopic } from '../services/geminiService';
import { Play, Users, Brain, Wand2, Copy, Check, X, Pencil, ArrowLeft } from 'lucide-react';
import HostGameScreen from './HostGameScreen';
import HostResultsScreen from './HostResultsScreen';
import Leaderboard from './Leaderboard';
import QuizCreator from './QuizCreator';

const CHANNEL_NAME = 'genhoot_channel';

const HostPanel: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [menuView, setMenuView] = useState<'SELECTION' | 'AI_SETUP' | 'MANUAL_SETUP'>('SELECTION');
  
  const [pin, setPin] = useState<string>("");
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Store both index-based and text-based answers
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, { index?: number; text?: string }>>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- Initialization ---
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      const msg = event.data as ChannelMessage;
      handleMessage(msg);
    };
    setChannel(bc);
    return () => bc.close();
  }, []);

  // --- Broadcast Logic ---
  const broadcastState = useCallback((overrideState?: Partial<HostStatePayload>) => {
    if (!channel) return;
    
    // Determine what to send based on current state
    const currentQ = quiz?.questions[currentQuestionIndex];
    
    // For text questions, we send the answer text during REVEAL so players can self-verify (simulated)
    const resultInfo = gameState === GameState.REVEAL && currentQ 
      ? { 
          correctIndex: currentQ.correctIndex, 
          correctText: currentQ.correctIndex === -1 ? currentQ.options[0] : undefined 
        } 
      : undefined;

    const payload: HostStatePayload = {
      pin,
      gameState: overrideState?.gameState || gameState,
      timeLeft: overrideState?.timeLeft ?? timeLeft,
      players: players.map(p => ({ ...p, lastAnswerCorrect: undefined })),
      currentQuestion: currentQ,
      resultInfo,
      ...overrideState
    };

    channel.postMessage({
      type: 'HOST_STATE_UPDATE',
      payload
    });
  }, [channel, gameState, pin, quiz, currentQuestionIndex, timeLeft, players]);

  // Sync state whenever it changes
  useEffect(() => {
    if (gameState !== GameState.MENU) {
      broadcastState();
    }
  }, [gameState, players, timeLeft, currentQuestionIndex, broadcastState]);

  const handleMessage = (msg: ChannelMessage) => {
    if (msg.type === 'PLAYER_JOIN') {
      const { name, pin: joinedPin, id } = msg.payload;
      setPin(currentPin => {
          if (joinedPin === currentPin) {
             setPlayers(prev => {
                if (prev.find(p => p.id === id)) return prev;
                return [...prev, { id, name, score: 0, streak: 0 }];
             });
          }
          return currentPin;
      });
    } else if (msg.type === 'PLAYER_ANSWER') {
      const { playerId, answerIndex, answerText } = msg.payload;
      setCurrentAnswers(prev => ({ 
          ...prev, 
          [playerId]: { index: answerIndex, text: answerText } 
      }));
    }
  };

  // --- Game Loop Handlers ---

  const handleManualQuizCreated = (createdQuiz: Quiz) => {
      setQuiz(createdQuiz);
      startLobby();
  };

  const generateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setIsGenerating(true);
    try {
      const data = await generateQuizFromTopic(topic);
      const newQuiz: Quiz = {
        title: data.title,
        topic,
        questions: data.questions.map((q, i) => ({
          id: `q-${i}`,
          type: q.type as any,
          text: q.questionText,
          options: q.options,
          correctIndex: q.correctOptionIndex,
          timeLimit: q.timeLimitSeconds
        }))
      };
      setQuiz(newQuiz);
      startLobby();
    } catch (err) {
      alert("Failed to generate quiz. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startLobby = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);
    setGameState(GameState.LOBBY);
  };

  const startGame = () => {
    setGameState(GameState.QUESTION);
    setCurrentQuestionIndex(0);
  };

  // Called by HostGameScreen when timer ends
  const onRoundFinished = () => {
    setGameState(GameState.REVEAL);
    setPlayers(currentPlayers => currentPlayers.map(p => {
        const currentQ = quiz!.questions[currentQuestionIndex];
        const ans = currentAnswers[p.id];
        
        let isCorrect = false;

        if (ans) {
            if (currentQ.correctIndex !== -1) {
                // MC or TF check
                isCorrect = ans.index === currentQ.correctIndex;
            } else {
                // Text check (Case insensitive)
                const correctText = currentQ.options[0].toLowerCase().trim();
                const playerText = (ans.text || "").toLowerCase().trim();
                isCorrect = correctText === playerText;
            }
        }
        
        let scoreAdd = 0;
        if (isCorrect) {
            scoreAdd = 1000 + (p.streak * 100);
        }

        return {
            ...p,
            score: p.score + scoreAdd,
            streak: isCorrect ? p.streak + 1 : 0,
            lastAnswerCorrect: isCorrect
        };
    }));
  };

  const nextQuestion = () => {
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
    setTopic("");
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
  };

  // --- Renders ---

  if (gameState === GameState.MENU) {
    if (menuView === 'MANUAL_SETUP') {
        return <QuizCreator onSave={handleManualQuizCreated} onCancel={() => setMenuView('SELECTION')} />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#46178f] to-[#250050] p-4 text-white">
        
        {menuView === 'SELECTION' && (
             <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-white/20 animate-in zoom-in duration-300">
                <div className="text-center mb-12">
                     <h1 className="text-4xl font-black mb-2 tracking-tight">Host Dashboard</h1>
                     <p className="text-white/60">Choose how you want to create your quiz</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => setMenuView('AI_SETUP')}
                        className="group bg-white/5 hover:bg-white text-left p-6 rounded-xl border-2 border-transparent hover:border-purple-400 transition-all duration-300"
                    >
                        <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-[#46178f]">Generate with AI</h3>
                        <p className="text-sm text-gray-300 group-hover:text-gray-600">Enter a topic and let Gemini create questions for you instantly.</p>
                    </button>

                    <button 
                        onClick={() => setMenuView('MANUAL_SETUP')}
                        className="group bg-white/5 hover:bg-white text-left p-6 rounded-xl border-2 border-transparent hover:border-blue-400 transition-all duration-300"
                    >
                        <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Pencil className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-blue-900">Create Manually</h3>
                        <p className="text-sm text-gray-300 group-hover:text-gray-600">Build your own custom quiz from scratch. Supports multiple formats.</p>
                    </button>
                </div>
             </div>
        )}

        {menuView === 'AI_SETUP' && (
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-white/20 animate-in slide-in-from-right">
                <button onClick={() => setMenuView('SELECTION')} className="text-white/50 hover:text-white mb-6 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white p-2 rounded-lg"><Brain className="w-8 h-8 text-[#46178f]" /></div>
                    <h1 className="text-3xl font-black">AI Generator</h1>
                </div>
                
                <form onSubmit={generateQuiz} className="space-y-6">
                    <div>
                    <label className="block font-bold mb-2">Quiz Topic</label>
                    <input 
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. 1990s Pop Music"
                        className="w-full p-4 rounded-xl text-gray-900 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-purple-400"
                        autoFocus
                    />
                    </div>
                    <button 
                    disabled={isGenerating || !topic}
                    className="w-full bg-white text-[#46178f] font-black text-xl py-4 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
                    >
                    {isGenerating ? <Wand2 className="animate-spin" /> : <Play fill="currentColor" />}
                    {isGenerating ? "Consulting Gemini..." : "Generate Quiz"}
                    </button>
                </form>
            </div>
        )}
      </div>
    );
  }

  if (gameState === GameState.LOBBY) {
    return (
      <div className="flex flex-col h-screen bg-[#46178f] text-white p-8">
        <div className="flex justify-between items-start mb-12">
            <div>
                <h2 className="text-2xl opacity-80 font-bold mb-2">Join at <span className="text-white underline">genhoot.com</span> (Simulated)</h2>
                <div className="bg-white text-[#46178f] p-6 rounded-xl inline-block shadow-2xl transform rotate-1">
                    <p className="text-xl font-bold uppercase tracking-wider mb-1">Game PIN:</p>
                    <p className="text-7xl font-black tracking-widest">{pin}</p>
                </div>
            </div>
            <div className="bg-black/20 px-6 py-4 rounded-xl flex items-center gap-3">
                <Users className="w-8 h-8" />
                <span className="text-4xl font-bold">{players.length}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-4">
                {players.map(p => (
                    <div key={p.id} className="bg-white/10 backdrop-blur border border-white/20 px-6 py-3 rounded-lg text-xl font-bold animate-in zoom-in flex items-center gap-3">
                        <span>{p.name}</span>
                        <div className="flex items-center gap-1 text-sm bg-black/20 px-2 py-1 rounded">
                            <span className="opacity-70">PTS:</span>
                            <span>{p.score}</span>
                        </div>
                    </div>
                ))}
                {players.length === 0 && (
                    <div className="w-full text-center mt-20 text-white/30 text-2xl font-bold animate-pulse">
                        Waiting for players to join...
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end mt-8">
            <button 
                onClick={startGame}
                disabled={players.length === 0}
                className="bg-white text-[#46178f] px-12 py-4 rounded-full font-black text-2xl hover:scale-105 transition disabled:opacity-50 disabled:grayscale"
            >
                Start Game
            </button>
        </div>
      </div>
    );
  }

  // Need to pass simple answer count for display
  const answerCount = Object.keys(currentAnswers).length;

  return (
    <div className="h-screen bg-[#46178f] text-white flex flex-col">
       <header className="p-4 bg-black/10 flex justify-between items-center">
         <span className="font-bold">{quiz?.title}</span>
         <span className="font-mono bg-white/10 px-3 py-1 rounded">PIN: {pin}</span>
       </header>

       <main className="flex-1 relative overflow-hidden">
          {gameState === GameState.QUESTION && quiz && (
             <HostGameScreen 
                question={quiz.questions[currentQuestionIndex]}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={quiz.questions.length}
                answersCount={answerCount}
                onTimerEnd={onRoundFinished}
             />
          )}

          {gameState === GameState.REVEAL && quiz && (
              <HostResultsScreen
                 question={quiz.questions[currentQuestionIndex]}
                 answers={currentAnswers as any} // Cast for compatibility with chart logic which expects index map
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
    </div>
  );
};

export default HostPanel;
