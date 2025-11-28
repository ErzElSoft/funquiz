
import React, { useEffect, useState } from 'react';
import { Question } from '../types';
import { Triangle, Hexagon, Circle, Square } from 'lucide-react';

interface Props {
  question: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  answersCount: number;
  onTimerEnd: () => void;
}

const SHAPES = [
  { color: 'bg-red-500', icon: Triangle },
  { color: 'bg-blue-500', icon: Hexagon },
  { color: 'bg-yellow-500', icon: Circle },
  { color: 'bg-green-500', icon: Square },
];

const HostGameScreen: React.FC<Props> = ({ question, currentQuestionIndex, totalQuestions, answersCount, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);

  useEffect(() => {
    setTimeLeft(question.timeLimit);
    const interval = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(interval);
                onTimerEnd();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [question, onTimerEnd]);

  const isTextType = question.type === 'SHORT_ANSWER' || question.type === 'FILL_IN_THE_BLANK';

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 relative z-10">
      <div className="flex justify-between items-center mb-6">
         <div className="bg-white/20 px-4 py-2 rounded font-bold text-white text-xl">
             {currentQuestionIndex + 1} / {totalQuestions}
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-10">
          <div className="bg-white text-gray-900 p-12 rounded shadow-2xl text-center w-full max-w-4xl min-h-[200px] flex items-center justify-center mb-8">
              <h2 className="text-4xl md:text-5xl font-black">{question.text}</h2>
          </div>

          <div className="flex items-center gap-12">
               <div className="w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-[#46178f] shadow-lg">
                   <span className="text-5xl font-black">{timeLeft}</span>
               </div>
               <div className="flex flex-col items-center">
                   <span className="text-6xl font-black">{answersCount}</span>
                   <span className="font-bold text-xl uppercase tracking-wider opacity-80">Answers</span>
               </div>
          </div>
      </div>

      {!isTextType && (
        <div className={`grid ${question.type === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 h-48`}>
            {question.options.map((opt, idx) => {
                const Style = SHAPES[idx];
                const Icon = Style.icon;
                return (
                    <div key={idx} className={`${Style.color} rounded shadow-lg flex items-center p-6 gap-4`}>
                        <Icon className="w-12 h-12 text-white fill-current shrink-0" />
                        <span className="text-white font-bold text-2xl leading-tight">{opt}</span>
                    </div>
                );
            })}
        </div>
      )}
      
      {isTextType && (
          <div className="h-48 flex items-center justify-center">
             <div className="bg-white/10 px-8 py-4 rounded-full animate-pulse text-2xl font-bold">
                 Players are typing...
             </div>
          </div>
      )}
    </div>
  );
};

export default HostGameScreen;
