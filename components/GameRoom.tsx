import React, { useEffect, useState } from 'react';
import { Question, Player } from '../types';
import { Clock, Square, Circle, Triangle, Hexagon } from 'lucide-react';

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  players: Player[];
  onTimeUp: (simulatedAnswers: Record<string, number>) => void;
}

const SHAPES = [
  { color: 'bg-red-500', icon: Triangle, label: 'triangle' },
  { color: 'bg-blue-500', icon: Hexagon, label: 'diamond' }, // Using Hexagon as proxy for diamond visual
  { color: 'bg-yellow-500', icon: Circle, label: 'circle' },
  { color: 'bg-green-500', icon: Square, label: 'square' },
];

const GameRoom: React.FC<Props> = ({ question, questionNumber, totalQuestions, players, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [hasEnded, setHasEnded] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !hasEnded) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !hasEnded) {
      handleFinish();
    }
  }, [timeLeft, hasEnded]);

  // Simulate Answers coming in
  useEffect(() => {
    if (hasEnded) return;

    // A bot answers roughly every (totalTime / playerCount) seconds with some randomness
    const answerInterval = setInterval(() => {
      setAnswerCount(prev => Math.min(prev + 1, players.length));
    }, (question.timeLimit * 1000) / (players.length * 1.5));

    return () => clearInterval(answerInterval);
  }, [hasEnded, players.length, question.timeLimit]);


  const handleFinish = () => {
    setHasEnded(true);
    // Simulate data collection from "Socket"
    const simulatedAnswers: Record<string, number> = {};
    players.forEach(p => {
      // 70% chance to be correct for demo fun
      const isCorrect = Math.random() > 0.3;
      // Random wrong answer if not correct
      const wrongIndex = (question.correctIndex + 1) % 4;
      simulatedAnswers[p.id] = isCorrect ? question.correctIndex : wrongIndex;
    });
    // Small delay to show "Time's Up" before switching state
    setTimeout(() => onTimeUp(simulatedAnswers), 1000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white/10 px-4 py-2 rounded-full font-bold text-lg">
          {questionNumber} / {totalQuestions}
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2">
           Answers: {answerCount}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center mb-8">
        <div className="bg-white text-gray-800 p-8 md:p-12 rounded-lg shadow-2xl text-center w-full mb-8 min-h-[200px] flex items-center justify-center">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">{question.text}</h2>
        </div>

        <div className="flex items-center gap-4">
           {/* Countdown Circle */}
          <div className="relative w-24 h-24 flex items-center justify-center bg-purple-900 rounded-full border-4 border-white shadow-lg">
             <span className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
               {timeLeft}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[30vh]">
        {question.options.map((option, idx) => {
          const Style = SHAPES[idx];
          const Icon = Style.icon;
          return (
            <div
              key={idx}
              className={`${Style.color} rounded shadow-lg p-6 flex items-center gap-6 transition-transform transform hover:scale-[1.01]`}
            >
              <div className="bg-black/20 p-4 rounded text-white">
                 <Icon className="w-8 h-8 fill-current" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                {option}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameRoom;