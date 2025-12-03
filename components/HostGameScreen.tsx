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
  { color: 'bg-red-500', icon: Triangle, label: 'Triangle' },
  { color: 'bg-blue-500', icon: Hexagon, label: 'Diamond' },
  { color: 'bg-yellow-500', icon: Circle, label: 'Circle' },
  { color: 'bg-green-500', icon: Square, label: 'Square' },
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
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10">
      
      {/* Progress */}
      <div className="flex justify-between items-center mb-6">
         <div className="bg-black/20 backdrop-blur px-4 py-2 rounded-full font-bold text-white text-lg border border-white/10">
             Question {currentQuestionIndex + 1} of {totalQuestions}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full">
          
          {/* Question Card */}
          <div className="bg-white text-[#46178f] p-8 md:p-16 rounded-3xl shadow-2xl text-center w-full shadow-purple-900/50 min-h-[250px] flex items-center justify-center mb-12 animate-in zoom-in duration-300">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-sm">{question.text}</h2>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-16 md:gap-32">
               {/* Timer */}
               <div className="relative group">
                   <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-8 bg-[#46178f] shadow-2xl flex items-center justify-center relative z-10 transition-colors duration-500 ${timeLeft <= 5 ? 'border-red-500 animate-pulse' : 'border-white'}`}>
                       <span className="text-5xl md:text-6xl font-black text-white">{timeLeft}</span>
                   </div>
                   {/* Decorative ring behind */}
                   <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 -z-0"></div>
               </div>

               {/* Answers Count */}
               <div className="flex flex-col items-center animate-in slide-in-from-right duration-500">
                   <span className="text-7xl md:text-8xl font-black drop-shadow-lg">{answersCount}</span>
                   <span className="font-bold text-xl uppercase tracking-widest opacity-80">Answers</span>
               </div>
          </div>
      </div>

      {/* Options Grid */}
      {!isTextType && (
        <div className={`grid ${question.type === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 md:gap-6 min-h-[200px]`}>
            {question.options.map((opt, idx) => {
                const Style = SHAPES[idx];
                const Icon = Style.icon;
                return (
                    <div key={idx} className={`${Style.color} rounded-2xl shadow-xl flex flex-col md:flex-row items-center p-6 gap-4 transform transition-transform duration-200 hover:scale-[1.02] border-2 border-white/10`}>
                        <div className="bg-black/20 p-3 rounded-xl shrink-0">
                            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white fill-current" />
                        </div>
                        <span className="text-white font-bold text-2xl md:text-3xl leading-tight text-shadow">{opt}</span>
                    </div>
                );
            })}
        </div>
      )}
      
      {isTextType && (
          <div className="h-48 flex items-center justify-center">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-12 py-6 rounded-full animate-pulse text-3xl font-black tracking-wider shadow-xl">
                 Players are typing...
             </div>
          </div>
      )}
    </div>
  );
};

export default HostGameScreen;