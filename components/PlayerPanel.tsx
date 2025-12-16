import React, { useState, useEffect } from 'react';
import { HostStatePayload, GameState } from '../types';
import { Triangle, Hexagon, Circle, Square, Check, X, Loader2, Send, Trophy, Medal, Frown, User, Cat, Dog, Smile, Heart, Star, Zap, Flame } from 'lucide-react';
import Footer from './Footer';
import { joinGame as firebaseJoinGame, listenToHostState, submitAnswer as firebaseSubmitAnswer, checkGameExists } from '../services/gameService';

const SHAPES = [
  { color: 'bg-red-500', icon: Triangle, shadow: 'shadow-red-900' },
  { color: 'bg-blue-500', icon: Hexagon, shadow: 'shadow-blue-900' },
  { color: 'bg-yellow-500', icon: Circle, shadow: 'shadow-yellow-900' },
  { color: 'bg-green-500', icon: Square, shadow: 'shadow-green-900' },
];

const AVATARS = [
  { emoji: '🐧', color: 'bg-gradient-to-br from-blue-400 to-blue-600', name: 'Penguin' },
  { emoji: '🦊', color: 'bg-gradient-to-br from-orange-400 to-orange-600', name: 'Fox' },
  { emoji: '🐻', color: 'bg-gradient-to-br from-amber-600 to-amber-800', name: 'Bear' },
  { emoji: '🐼', color: 'bg-gradient-to-br from-gray-300 to-gray-600', name: 'Panda' },
  { emoji: '🦁', color: 'bg-gradient-to-br from-yellow-500 to-orange-600', name: 'Lion' },
  { emoji: '🐸', color: 'bg-gradient-to-br from-green-400 to-green-600', name: 'Frog' },
  { emoji: '🦄', color: 'bg-gradient-to-br from-pink-400 to-purple-600', name: 'Unicorn' },
  { emoji: '🐙', color: 'bg-gradient-to-br from-purple-400 to-purple-700', name: 'Octopus' },
  { emoji: '🦖', color: 'bg-gradient-to-br from-green-500 to-green-700', name: 'Dino' },
  { emoji: '🐱', color: 'bg-gradient-to-br from-orange-300 to-orange-500', name: 'Cat' },
  { emoji: '🐶', color: 'bg-gradient-to-br from-amber-400 to-amber-600', name: 'Dog' },
  { emoji: '🐰', color: 'bg-gradient-to-br from-pink-300 to-pink-500', name: 'Bunny' },
];

const STORAGE_KEY = 'quiz_player_session';

interface PlayerSession {
  playerId: string;
  playerName: string;
  gamePin: string;
  selectedAvatar: number;
  customPhoto: string | null;
  hasJoined: boolean;
}

const PlayerPanel: React.FC = () => {
  // Get PIN from URL query parameter if present
  const urlParams = new URLSearchParams(window.location.search);
  const pinFromUrl = urlParams.get('pin') || '';
  
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState(pinFromUrl);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [playerId, setPlayerId] = useState(() => {
    // Try to get existing playerId from localStorage, or create new one
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const session: PlayerSession = JSON.parse(saved);
      return session.playerId;
    }
    return `player-${Math.random().toString(36).substr(2, 9)}`;
  });
  const [restoringSession, setRestoringSession] = useState(true);
  
  const [hostState, setHostState] = useState<HostStatePayload | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [hostExited, setHostExited] = useState(false);

  const [textAnswer, setTextAnswer] = useState('');
  const [mySelectedAnswerIdx, setMySelectedAnswerIdx] = useState<number | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
          const session: PlayerSession = JSON.parse(savedSession);
          
          // Check if the game still exists
          const gameExists = await checkGameExists(session.gamePin);
          
          if (gameExists) {
            // Restore session
            setPlayerId(session.playerId);
            setName(session.playerName);
            setPin(session.gamePin);
            setSelectedAvatar(session.selectedAvatar);
            setCustomPhoto(session.customPhoto);
            setJoined(true);
            
            console.log('Session restored successfully with playerId:', session.playerId);
          } else {
            // Game no longer exists, clear session
            localStorage.removeItem(STORAGE_KEY);
            console.log('Game no longer exists, session cleared');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setRestoringSession(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Player session restoration timeout');
      setRestoringSession(false);
    }, 3000);

    restoreSession().then(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  // Save session when player joins
  useEffect(() => {
    if (joined && pin && name) {
      const session: PlayerSession = {
        playerId,
        playerName: name,
        gamePin: pin,
        selectedAvatar,
        customPhoto,
        hasJoined: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [joined, pin, name, playerId, selectedAvatar, customPhoto]);

  // Clear session when game ends
  useEffect(() => {
    if (hostState?.gameState === GameState.FINISH) {
      // Clear session after a delay to allow player to see final results
      const timer = setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Session cleared after game end');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hostState?.gameState]);

  useEffect(() => {
    if (joined && pin) {
      console.log('Player listening to hostState for PIN:', pin);
      const unsubscribe = listenToHostState(pin, (state) => {
        console.log('Received hostState:', state);
        
        // Check if host has exited (state is null or game doesn't exist)
        if (state === null) {
          // Host has exited, show message screen
          setHostExited(true);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        
        setHostState(prev => {
          if (prev?.gameState !== GameState.QUESTION && state?.gameState === GameState.QUESTION) {
            setHasAnswered(false);
            setLastResult(null);
            setTextAnswer('');
            setMySelectedAnswerIdx(null);
          }
          return state;
        });
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [joined, pin]);

  useEffect(() => {
     if (hostState?.gameState === GameState.REVEAL && hostState.resultInfo) {
        if (hostState.resultInfo.correctIndex !== -1 && mySelectedAnswerIdx !== null) {
            if (mySelectedAnswerIdx === hostState.resultInfo.correctIndex) {
                setLastResult('correct');
            } else {
                setLastResult('wrong');
            }
        } 
        else if (hostState.resultInfo.correctText && hasAnswered) {
             const correct = hostState.resultInfo.correctText.toLowerCase().trim();
             const myAns = textAnswer.toLowerCase().trim();
             if (myAns === correct) setLastResult('correct');
             else setLastResult('wrong');
        }
     }
  }, [hostState?.gameState, hostState?.resultInfo, hasAnswered, mySelectedAnswerIdx, textAnswer]);

  // Check if game still exists after waiting for hostState
  useEffect(() => {
    if (joined && !hostState && pin) {
      console.log('Waiting for hostState to load for PIN:', pin);
      // Wait a bit for hostState to load
      const timer = setTimeout(async () => {
        console.log('Checking if game exists after timeout...');
        // Still no hostState after waiting, check if game exists
        try {
          const gameExists = await checkGameExists(pin);
          console.log('Game exists check result:', gameExists);
          if (!gameExists) {
            // Game doesn't exist, clear session and return to join screen
            console.log('Game no longer exists, returning to join screen');
            alert('Game not found! The host may have ended the game.');
            localStorage.removeItem(STORAGE_KEY);
            setJoined(false);
            setPin('');
            setName('');
            setHostState(null);
          }
        } catch (error) {
          console.error('Error checking game existence:', error);
        }
      }, 3000); // Wait 3 seconds for hostState to load
      
      return () => clearTimeout(timer);
    }
  }, [joined, hostState, pin]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCustomPhoto(photoData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setShowCamera(false);
    }
  };

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin) return;
    
    // Check if game exists
    const gameExists = await checkGameExists(pin);
    if (!gameExists) {
      alert('Game not found! Please check the PIN.');
      return;
    }
    
    // Join the game
    const avatarData = customPhoto || AVATARS[selectedAvatar].emoji;
    await firebaseJoinGame(pin, {
      id: playerId,
      name,
      score: 0,
      streak: 0,
      avatar: avatarData
    });
    
    setJoined(true);
  };

  const submitAnswer = async (index: number) => {
      if (!pin || !hostState || hasAnswered) return;
      
      const timeLeft = hostState.timeLeft || 0;
      
      await firebaseSubmitAnswer(pin, playerId, {
        answerIndex: index,
        timeRemaining: timeLeft
      });
      
      setMySelectedAnswerIdx(index);
      setHasAnswered(true);
  };

  const submitTextAnswer = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pin || !hostState || hasAnswered || !textAnswer.trim()) return;
      
      const timeLeft = hostState.timeLeft || 0;
      
      await firebaseSubmitAnswer(pin, playerId, {
        answerText: textAnswer.trim(),
        timeRemaining: timeLeft
      });
      
      setHasAnswered(true);
  };

  // Show host exited screen
  if (hostExited) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-32 relative z-10 bg-gradient-to-br from-red-600 to-orange-600">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Ended</h1>
          <p className="text-gray-600 mb-8 text-lg">
            The host has exited the quiz. Thank you for playing!
          </p>
          <button
            onClick={() => {
              setHostExited(false);
              setJoined(false);
              setPin('');
              setName('');
              setHostState(null);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all transform active:scale-95 shadow-lg"
          >
            Join Another Game
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (restoringSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-32 relative z-10" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold">Restoring session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-32 relative z-10">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-white/20">
           <div className="text-center mb-8">
             <h1 className="text-4xl font-semibold text-[#46178f] mb-2">Quiz</h1>
             <p className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Enter Game Details</p>
           </div>
           <form onSubmit={joinGame} className="space-y-5">
              <input 
                placeholder="Game PIN" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full p-4 bg-gray-100 text-gray-900 rounded-lg font-bold text-center text-xl border-2 border-transparent focus:border-[#46178f] focus:bg-white outline-none transition-colors placeholder:text-gray-400"
                type="number"
                inputMode="numeric"
              />
              <input 
                placeholder="Nickname" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-gray-100 text-gray-900 rounded-lg font-bold text-center text-xl border-2 border-transparent focus:border-[#46178f] focus:bg-white outline-none transition-colors placeholder:text-gray-400"
              />
              
              {/* Avatar Selection */}
              <div>
                <p className="text-gray-700 font-bold text-sm mb-3 text-center uppercase tracking-wider">Choose Your Character</p>
                
                {/* Custom Photo Option - HIDDEN FOR NOW */}
                {/* Uncomment below to enable custom photo feature */}
                {/*
                {customPhoto ? (
                  <div className="mb-3 flex items-center gap-3 bg-gray-100 p-3 rounded-xl">
                    <img src={customPhoto} alt="Your photo" className="w-16 h-16 rounded-full object-cover border-4 border-[#46178f]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700">Your Photo</p>
                      <button
                        type="button"
                        onClick={() => setCustomPhoto(null)}
                        className="text-xs text-red-500 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : showCamera ? (
                  <div className="mb-3 bg-black rounded-xl overflow-hidden relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-white text-[#46178f] px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full mb-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <User className="w-5 h-5" /> Take Your Photo
                  </button>
                )}
                */}
                
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {AVATARS.map((avatar, idx) => {
                    const isSelected = !customPhoto && selectedAvatar === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomPhoto(null);
                          setSelectedAvatar(idx);
                        }}
                        className={`${avatar.color} p-3 rounded-2xl flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-lg relative ${
                          isSelected ? 'ring-4 ring-[#46178f] scale-105 shadow-2xl' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="text-4xl mb-1">{avatar.emoji}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-[#46178f] rounded-full w-6 h-6 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                disabled={!name || !pin}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-5 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                Enter Game
              </button>
           </form>
        </div>
        
        <Footer />
      </div>
    );
  }

  // Show lobby screen if in LOBBY state OR if just joined and waiting for host state
  if (hostState?.gameState === GameState.LOBBY || (joined && !hostState)) {
      console.log('Showing lobby screen. hostState:', hostState);
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 text-white text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl mb-8 shadow-2xl">
                  <h1 className="text-4xl font-black mb-2">You're in!</h1>
                  <p className="text-xl font-bold opacity-80">See your name on screen?</p>
              </div>
              <Loader2 className="w-12 h-12 animate-spin text-white/50" />
              <Footer />
          </div>
      );
  }

  if (hostState?.gameState === GameState.LEADERBOARD || hostState?.gameState === GameState.MENU) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 text-white text-center">
             <div className="bg-[#46178f] p-6 rounded-full shadow-lg mb-6 animate-bounce">
                <Trophy className="w-12 h-12 text-yellow-300" />
             </div>
             <h1 className="text-3xl font-black mb-2">Scoreboard</h1>
             <p className="opacity-80 font-medium">Check the host screen...</p>
             <Footer />
        </div>
     );
  }

  if (hostState?.gameState === GameState.FINISH) {
      const allPlayers = hostState.players || [];
      const sorted = [...allPlayers].sort((a, b) => b.score - a.score);
      const myRank = sorted.findIndex(p => p.id === playerId) + 1;
      const myScore = sorted.find(p => p.id === playerId)?.score || 0;

      let rankColor = 'bg-[#46178f]';
      let msg = "Great Game!";
      let Icon = Trophy;
      
      if (myRank === 1) { rankColor = 'bg-yellow-500'; msg = "WINNER!"; Icon = Trophy; }
      else if (myRank === 2) { rankColor = 'bg-gray-400'; msg = "2nd Place!"; Icon = Medal; }
      else if (myRank === 3) { rankColor = 'bg-orange-600'; msg = "3rd Place!"; Icon = Medal; }
      else { msg = `You placed ${myRank}th`; Icon = Frown; }

      return (
          <div className={`min-h-screen ${rankColor} flex flex-col items-center justify-center p-8 pb-20 text-white text-center animate-in zoom-in duration-500 z-50 fixed inset-0`}>
              <div className="bg-black/20 p-8 rounded-full mb-6 shadow-xl">
                 <Icon className="w-24 h-24" />
              </div>
              <h1 className="text-6xl font-black mb-4 drop-shadow-md">{msg}</h1>
              <div className="bg-black/20 px-10 py-6 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-xl font-bold opacity-80 mb-1 uppercase tracking-wider">Final Score</p>
                  <p className="text-5xl font-black">{myScore}</p>
              </div>
              <Footer />
          </div>
      );
  }

  if (hostState?.gameState === GameState.REVEAL) {
      const isCorrect = lastResult === 'correct';
      return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-8 pb-20 text-white text-center fixed inset-0 z-50 ${isCorrect ? 'bg-green-600' : 'bg-red-600'} animate-in fade-in`}>
              <div className="bg-white/20 p-10 rounded-full mb-8 shadow-2xl animate-in zoom-in delay-200 duration-500">
                 {isCorrect ? <Check className="w-20 h-20" /> : <X className="w-20 h-20" />}
              </div>
              <h1 className="text-5xl font-black mb-4 drop-shadow-md">{isCorrect ? "Correct!" : "Incorrect"}</h1>
              <div className="bg-black/20 px-8 py-3 rounded-full font-bold text-xl inline-block">
                {isCorrect ? "+ Points" : "Stay focused!"}
              </div>
              <Footer />
          </div>
      );
  }

  if (hostState?.gameState === GameState.QUESTION) {
      const timeLeft = hostState.timeLeft || 0;
      const isLowTime = timeLeft <= 5;

      if (hasAnswered) {
        return (
            <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 pb-20 text-white text-center">
                {/* Timer */}
                <div className="mb-8">
                  <div className={`w-24 h-24 rounded-full border-4 ${isLowTime ? 'border-red-500 bg-red-500 animate-pulse' : 'border-white bg-white/20'} flex items-center justify-center shadow-xl transition-all mx-auto`}>
                    <span className="text-4xl font-black text-white">{timeLeft}</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/20 shadow-2xl animate-in zoom-in">
                    <h1 className="text-4xl font-black mb-4">Answer Sent!</h1>
                    <div className="animate-pulse opacity-70 font-bold">Waiting for results...</div>
                </div>
                <Footer />
            </div>
        );
      }
      
      const currentQ = hostState.currentQuestion;
      const isText = currentQ?.type === 'SHORT_ANSWER' || currentQ?.type === 'FILL_IN_THE_BLANK';

      if (isText) {
          return (
            <div className="min-h-screen bg-white p-6 pb-20 flex flex-col items-center justify-center fixed inset-0 z-50">
                {/* Timer */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`w-20 h-20 rounded-full border-4 ${isLowTime ? 'border-red-500 bg-red-500 animate-pulse' : 'border-[#46178f] bg-[#46178f]'} flex items-center justify-center shadow-xl transition-all`}>
                    <span className="text-3xl font-black text-white">{timeLeft}</span>
                  </div>
                </div>

                <div className="w-full max-w-2xl px-4">
                     {/* Question Text */}
                     <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-6">
                        <p className="text-gray-800 font-bold text-xl sm:text-2xl text-center leading-relaxed">
                          {currentQ?.text}
                        </p>
                     </div>
                     
                     <h2 className="text-[#46178f] font-black text-xl sm:text-2xl mb-6 text-center uppercase tracking-wide">
                        {currentQ?.type === 'FILL_IN_THE_BLANK' ? "Fill in the blank" : "Type your answer"}
                     </h2>
                     <form onSubmit={submitTextAnswer} className="space-y-6">
                        <input
                           value={textAnswer}
                           onChange={e => setTextAnswer(e.target.value)}
                           placeholder="Type here..."
                           className="w-full border-b-4 border-gray-200 text-2xl sm:text-4xl font-black text-center py-4 focus:outline-none focus:border-[#46178f] text-gray-800 transition-colors placeholder:text-gray-300"
                           autoFocus
                        />
                        <button 
                          className="w-full bg-[#46178f] text-white py-4 sm:py-6 rounded-2xl font-black text-xl sm:text-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-[#35126f]"
                        >
                           Submit Answer <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                     </form>
                </div>
                <Footer />
            </div>
          );
      }

      const isTF = currentQ?.type === 'TRUE_FALSE';
      return (
          <div className="min-h-screen bg-gradient-to-br from-[#46178f] to-[#764ba2] p-3 sm:p-4 pb-24 flex flex-col items-center justify-center relative z-50">
              {/* Timer */}
              <div className="mb-4 sm:mb-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 sm:border-8 ${isLowTime ? 'border-red-500 bg-red-500 animate-pulse' : 'border-white bg-[#46178f]'} flex items-center justify-center shadow-2xl transition-all`}>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{timeLeft}</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-white p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl mb-4 sm:mb-8 w-full max-w-4xl">
                <p className="text-[#46178f] font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl text-center leading-tight">
                  {currentQ?.text}
                </p>
              </div>

              {/* Answer Buttons */}
              <div className={`w-full max-w-4xl px-2 ${isTF ? 'flex flex-col sm:flex-row gap-3 sm:gap-4' : 'grid grid-cols-2 gap-3 sm:gap-4'}`}>
                  {SHAPES.slice(0, isTF ? 2 : 4).map((shape, idx) => {
                      const Icon = shape.icon;
                      return (
                        <button
                            key={idx}
                            onClick={() => {
                                console.log('Button clicked:', idx);
                                submitAnswer(idx);
                            }}
                            className={`${shape.color} ${shape.shadow} rounded-xl sm:rounded-2xl flex items-center ${isTF ? 'justify-start px-4 sm:px-8' : 'justify-center flex-col sm:flex-row'} gap-2 sm:gap-4 py-4 sm:py-6 shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[8px] transition-all cursor-pointer touch-manipulation ${isTF ? 'flex-1' : 'min-h-[100px] sm:min-h-[120px]'}`}
                        >
                            <div className="bg-black/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white fill-current" />
                            </div>
                            {isTF && (
                                <span className="text-white font-black text-xl sm:text-2xl md:text-3xl uppercase tracking-wider">
                                    {idx === 0 ? "True" : "False"}
                                </span>
                            )}
                        </button>
                      );
                  })}
              </div>
              <Footer />
          </div>
      );
  }

  // Fallback - should not reach here
  console.log('Fallback render. hostState:', hostState, 'joined:', joined);
  return (
    <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center text-white p-8 pb-20">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm opacity-70">State: {hostState?.gameState || 'null'}</p>
        <p className="text-xs opacity-50 mt-2">Joined: {joined ? 'Yes' : 'No'}</p>
        <Footer />
    </div>
  );
};

export default PlayerPanel;