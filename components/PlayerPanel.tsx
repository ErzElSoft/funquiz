
import React, { useState, useEffect } from 'react';
import { ChannelMessage, HostStatePayload, GameState } from '../types';
import { Triangle, Hexagon, Circle, Square, Check, X, Loader2, Send, Trophy, Medal, Frown } from 'lucide-react';

const CHANNEL_NAME = 'genhoot_channel';

const SHAPES = [
  { color: 'bg-red-500', icon: Triangle, shadow: 'shadow-red-900' },
  { color: 'bg-blue-500', icon: Hexagon, shadow: 'shadow-blue-900' },
  { color: 'bg-yellow-500', icon: Circle, shadow: 'shadow-yellow-900' },
  { color: 'bg-green-500', icon: Square, shadow: 'shadow-green-900' },
];

const PlayerPanel: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [playerId] = useState(() => `player-${Math.random().toString(36).substr(2, 9)}`);
  
  const [hostState, setHostState] = useState<HostStatePayload | null>(null);
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  const [textAnswer, setTextAnswer] = useState('');
  const [mySelectedAnswerIdx, setMySelectedAnswerIdx] = useState<number | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      const msg = event.data as ChannelMessage;
      if (msg.type === 'HOST_STATE_UPDATE') {
        const payload = msg.payload;
        setHostState(prev => {
           if (prev?.gameState !== GameState.QUESTION && payload.gameState === GameState.QUESTION) {
               setHasAnswered(false);
               setLastResult(null);
               setTextAnswer('');
               setMySelectedAnswerIdx(null);
           }
           return payload;
        });
      }
    };
    setChannel(bc);
    return () => bc.close();
  }, []);

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

  const joinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin || !channel) return;
    channel.postMessage({
        type: 'PLAYER_JOIN',
        payload: { name, pin, id: playerId }
    });
    setJoined(true);
  };

  const submitAnswer = (index: number) => {
      if (!channel || !hostState || hasAnswered) return;
      channel.postMessage({
          type: 'PLAYER_ANSWER',
          payload: { playerId, answerIndex: index, timeRemaining: 0 }
      });
      setMySelectedAnswerIdx(index);
      setHasAnswered(true);
  };

  const submitTextAnswer = (e: React.FormEvent) => {
      e.preventDefault();
      if (!channel || !hostState || hasAnswered || !textAnswer.trim()) return;
      channel.postMessage({
          type: 'PLAYER_ANSWER',
          payload: { playerId, answerText: textAnswer.trim(), timeRemaining: 0 }
      });
      setHasAnswered(true);
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl border border-gray-100">
           <div className="text-center mb-8">
             <h1 className="text-3xl font-black text-[#46178f] mb-1">ErzEl Quiz</h1>
             <p className="text-gray-400 font-bold text-sm">ENTER GAME DETAILS</p>
           </div>
           <form onSubmit={joinGame} className="space-y-4">
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
              <button 
                disabled={!name || !pin}
                className="w-full bg-[#333] text-white font-bold py-4 rounded-lg hover:bg-black transition-all transform active:scale-95 disabled:opacity-50"
              >
                Enter Game
              </button>
           </form>
        </div>
        <footer className="mt-8 text-gray-400 text-xs font-medium">
            Powered by ErzEl Soft - <a href="https://www.erzelsoft.com" target="_blank" rel="noreferrer" className="hover:text-[#46178f] underline">www.erzelsoft.com</a>
        </footer>
      </div>
    );
  }

  if (hostState?.gameState === GameState.LOBBY) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white text-center animate-in fade-in">
              <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl mb-8 shadow-xl">
                  <h1 className="text-4xl font-black mb-2">You're in!</h1>
                  <p className="text-xl font-bold opacity-80">See your name on screen?</p>
              </div>
              <div className="animate-spin text-white/50"><Loader2 className="w-12 h-12" /></div>
          </div>
      );
  }

  if (hostState?.gameState === GameState.LEADERBOARD || hostState?.gameState === GameState.MENU) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white text-center">
             <div className="bg-[#46178f] p-6 rounded-full shadow-lg mb-6 animate-bounce">
                <Trophy className="w-12 h-12 text-yellow-300" />
             </div>
             <h1 className="text-3xl font-black mb-2">Scoreboard</h1>
             <p className="opacity-80 font-medium">Check the host screen...</p>
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
          <div className={`min-h-screen ${rankColor} flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500 z-50 fixed inset-0`}>
              <div className="bg-black/20 p-8 rounded-full mb-6 shadow-xl">
                 <Icon className="w-24 h-24" />
              </div>
              <h1 className="text-6xl font-black mb-4 drop-shadow-md">{msg}</h1>
              <div className="bg-black/20 px-10 py-6 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-xl font-bold opacity-80 mb-1 uppercase tracking-wider">Final Score</p>
                  <p className="text-5xl font-black">{myScore}</p>
              </div>
          </div>
      );
  }

  if (hostState?.gameState === GameState.REVEAL) {
      const isCorrect = lastResult === 'correct';
      return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-8 text-white text-center fixed inset-0 z-50 ${isCorrect ? 'bg-green-600' : 'bg-red-600'} animate-in fade-in`}>
              <div className="bg-white/20 p-10 rounded-full mb-8 shadow-2xl animate-in zoom-in delay-200 duration-500">
                 {isCorrect ? <Check className="w-20 h-20" /> : <X className="w-20 h-20" />}
              </div>
              <h1 className="text-5xl font-black mb-4 drop-shadow-md">{isCorrect ? "Correct!" : "Incorrect"}</h1>
              <div className="bg-black/20 px-8 py-3 rounded-full font-bold text-xl inline-block">
                {isCorrect ? "+ Points" : "Stay focused!"}
              </div>
          </div>
      );
  }

  if (hostState?.gameState === GameState.QUESTION) {
      if (hasAnswered) {
        const currentQ = hostState.currentQuestion;
        const isText = currentQ?.type === 'SHORT_ANSWER' || currentQ?.type === 'FILL_IN_THE_BLANK';

        return (
            <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 text-white text-center">
                <div className="bg-white/10 backdrop-blur-md p-10 md:p-12 rounded-3xl border border-white/20 shadow-2xl animate-in zoom-in max-w-lg w-full">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white text-[#46178f] rounded-full p-4 shadow-xl animate-bounce">
                            <Check className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4">Answer Sent!</h1>
                    
                    {isText && textAnswer && (
                        <div className="bg-black/20 px-6 py-4 rounded-2xl mb-6 border border-white/10">
                            <p className="opacity-60 text-xs font-bold uppercase tracking-widest mb-2">Your Answer</p>
                            <p className="text-2xl font-bold break-words leading-tight">"{textAnswer}"</p>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 animate-pulse opacity-70 font-bold bg-white/5 py-2 px-4 rounded-full inline-flex">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Waiting for results...</span>
                    </div>
                </div>
            </div>
        );
      }
      
      const currentQ = hostState.currentQuestion;
      const isText = currentQ?.type === 'SHORT_ANSWER' || currentQ?.type === 'FILL_IN_THE_BLANK';

      if (isText) {
          return (
            <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center fixed inset-0 z-50">
                <div className="w-full max-w-md">
                     <h2 className="text-[#46178f] font-black text-2xl mb-8 text-center uppercase tracking-wide">
                        {currentQ?.type === 'FILL_IN_THE_BLANK' ? "Fill in the blank" : "Type your answer"}
                     </h2>
                     <form onSubmit={submitTextAnswer} className="space-y-6">
                        <input
                           value={textAnswer}
                           onChange={e => setTextAnswer(e.target.value)}
                           placeholder="Type here..."
                           className="w-full border-b-4 border-gray-200 text-4xl font-black text-center py-4 focus:outline-none focus:border-[#46178f] text-gray-800 transition-colors placeholder:text-gray-300"
                           autoFocus
                        />
                        <button 
                          className="w-full bg-[#46178f] text-white py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-[#35126f]"
                        >
                           Submit Answer <Send className="w-6 h-6" />
                        </button>
                     </form>
                </div>
            </div>
          );
      }

      const isTF = currentQ?.type === 'TRUE_FALSE';
      // Image Choice is treated like Multiple Choice (4 buttons)
      return (
          <div className="h-screen bg-gray-100 p-4 pb- safe-area-inset-bottom flex flex-col fixed inset-0 z-50">
              <div className="flex-1 grid grid-cols-2 gap-4 h-full">
                  {SHAPES.slice(0, isTF ? 2 : 4).map((shape, idx) => {
                      const Icon = shape.icon;
                      return (
                        <button
                            key={idx}
                            onClick={() => submitAnswer(idx)}
                            className={`${shape.color} ${shape.shadow} rounded-xl flex flex-col items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[8px] transition-all`}
                        >
                            <div className="bg-black/20 p-4 rounded-xl mb-4">
                                <Icon className="w-12 h-12 md:w-20 md:h-20 text-white fill-current" />
                            </div>
                            {isTF && (
                                <span className="text-white font-black text-3xl uppercase tracking-wider text-shadow">
                                    {idx === 0 ? "True" : "False"}
                                </span>
                            )}
                        </button>
                      );
                  })}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#46178f] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );
};

export default PlayerPanel;
