
import React, { useState, useEffect } from 'react';
import { ChannelMessage, HostStatePayload, GameState } from '../types';
import { Triangle, Hexagon, Circle, Square, Check, X, Loader2, Send, Trophy, Medal, Frown } from 'lucide-react';

const CHANNEL_NAME = 'genhoot_channel';

const SHAPES = [
  { color: 'bg-red-500', icon: Triangle },
  { color: 'bg-blue-500', icon: Hexagon },
  { color: 'bg-yellow-500', icon: Circle },
  { color: 'bg-green-500', icon: Square },
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

  // Text input state
  const [textAnswer, setTextAnswer] = useState('');
  const [mySelectedAnswerIdx, setMySelectedAnswerIdx] = useState<number | null>(null);

  // --- Connection ---
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      const msg = event.data as ChannelMessage;
      if (msg.type === 'HOST_STATE_UPDATE') {
        const payload = msg.payload;
        
        setHostState(prev => {
           // Reset answer state on new question
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


  // Determine result when state changes to REVEAL
  useEffect(() => {
     if (hostState?.gameState === GameState.REVEAL && hostState.resultInfo) {
        // For MC/TF
        if (hostState.resultInfo.correctIndex !== -1 && mySelectedAnswerIdx !== null) {
            if (mySelectedAnswerIdx === hostState.resultInfo.correctIndex) {
                setLastResult('correct');
            } else {
                setLastResult('wrong');
            }
        } 
        // For Text Types
        else if (hostState.resultInfo.correctText && hasAnswered) {
             const correct = hostState.resultInfo.correctText.toLowerCase().trim();
             const myAns = textAnswer.toLowerCase().trim();
             if (myAns === correct) setLastResult('correct');
             else setLastResult('wrong');
        }
     }
  }, [hostState?.gameState, hostState?.resultInfo, hasAnswered, mySelectedAnswerIdx, textAnswer]);


  // --- Actions ---

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

  // --- Renderers ---

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#46178f] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
           <h1 className="text-2xl font-black text-center mb-6 text-[#46178f]">Join Game</h1>
           <form onSubmit={joinGame} className="space-y-4">
              <input 
                placeholder="Game PIN" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full p-4 bg-gray-100 rounded font-bold text-center text-xl border-2 border-transparent focus:border-[#46178f] outline-none"
                type="number"
              />
              <input 
                placeholder="Nickname" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-gray-100 rounded font-bold text-center text-xl border-2 border-transparent focus:border-[#46178f] outline-none"
              />
              <button 
                disabled={!name || !pin}
                className="w-full bg-[#333] text-white font-bold py-4 rounded hover:bg-black transition"
              >
                Enter
              </button>
           </form>
        </div>
      </div>
    );
  }

  // Waiting in Lobby
  if (hostState?.gameState === GameState.LOBBY) {
      return (
          <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 text-white text-center">
              <h1 className="text-4xl font-black mb-4">You're in!</h1>
              <p className="text-xl mb-8">See your name on screen?</p>
              <div className="animate-spin text-white/50"><Loader2 className="w-12 h-12" /></div>
          </div>
      );
  }

  // Waiting for next question (Leaderboard, etc)
  if (hostState?.gameState === GameState.LEADERBOARD || hostState?.gameState === GameState.MENU) {
     return (
        <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 text-white text-center">
             <h1 className="text-2xl font-bold">Look at the host screen</h1>
             <div className="mt-8 animate-bounce"><Loader2 className="w-8 h-8" /></div>
        </div>
     );
  }

  // Game Over / Final Podium
  if (hostState?.gameState === GameState.FINISH) {
      // Calculate my rank
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
          <div className={`min-h-screen ${rankColor} flex flex-col items-center justify-center p-8 text-white text-center animate-in zoom-in duration-500`}>
              <div className="bg-black/20 p-8 rounded-full mb-6">
                 <Icon className="w-20 h-20" />
              </div>
              <h1 className="text-5xl font-black mb-4">{msg}</h1>
              <div className="bg-black/20 px-8 py-4 rounded-xl">
                  <p className="text-2xl font-bold opacity-80 mb-1">Final Score</p>
                  <p className="text-4xl font-black">{myScore}</p>
              </div>
          </div>
      );
  }

  // Result Screen
  if (hostState?.gameState === GameState.REVEAL) {
      const isCorrect = lastResult === 'correct';
      return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-8 text-white text-center ${isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
              <div className="bg-white/20 p-8 rounded-full mb-6">
                 {isCorrect ? <Check className="w-16 h-16" /> : <X className="w-16 h-16" />}
              </div>
              <h1 className="text-4xl font-black mb-2">{isCorrect ? "Correct!" : "Incorrect"}</h1>
              <p className="opacity-80 font-bold text-xl">{isCorrect ? "+Points" : "Better luck next time"}</p>
              <div className="mt-12 text-sm opacity-50">Waiting for host...</div>
          </div>
      );
  }

  // Game Controller
  if (hostState?.gameState === GameState.QUESTION) {
      if (hasAnswered) {
        return (
            <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 text-white text-center">
                <h1 className="text-3xl font-bold mb-4">Answer Sent!</h1>
                <div className="animate-pulse">Wait for result...</div>
            </div>
        );
      }
      
      const currentQ = hostState.currentQuestion;
      const isText = currentQ?.type === 'SHORT_ANSWER' || currentQ?.type === 'FILL_IN_THE_BLANK';

      if (isText) {
          return (
            <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-md">
                     <h2 className="text-[#46178f] font-bold text-xl mb-6 text-center">{currentQ?.type === 'FILL_IN_THE_BLANK' ? "Fill in the blank" : "Type your answer"}</h2>
                     <form onSubmit={submitTextAnswer} className="space-y-4">
                        <input
                           value={textAnswer}
                           onChange={e => setTextAnswer(e.target.value)}
                           placeholder="Type here..."
                           className="w-full border-b-4 border-[#46178f] text-3xl font-bold text-center py-4 focus:outline-none text-gray-800"
                           autoFocus
                        />
                        <button 
                          className="w-full bg-[#46178f] text-white py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                        >
                           Submit <Send className="w-5 h-5" />
                        </button>
                     </form>
                </div>
            </div>
          );
      }

      // Default MC/TF Buttons
      const isTF = currentQ?.type === 'TRUE_FALSE';
      return (
          <div className="min-h-screen bg-gray-900 p-4 pb-8 flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4">
                  {SHAPES.slice(0, isTF ? 2 : 4).map((shape, idx) => {
                      const Icon = shape.icon;
                      return (
                        <button
                            key={idx}
                            onClick={() => submitAnswer(idx)}
                            className={`${shape.color} rounded-lg flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform`}
                        >
                            <Icon className="w-16 h-16 text-white fill-current" />
                            {isTF && (
                                <span className="text-white font-black text-2xl mt-4 uppercase">
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
        Loading...
    </div>
  );
};

export default PlayerPanel;
