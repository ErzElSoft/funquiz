
import React from 'react';
import { Question } from '../types';
import { Check } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

interface Answer {
  index?: number;
  text?: string;
}

interface Props {
  question: Question;
  answers: Record<string, Answer>;
  onNext: () => void;
  isLast: boolean;
}

const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];

const HostResultsScreen: React.FC<Props> = ({ question, answers, onNext, isLast }) => {
  
  const isTextType = question.type === 'SHORT_ANSWER' || question.type === 'FILL_IN_THE_BLANK';

  const renderChart = () => {
    const counts = [0, 0, 0, 0];
    Object.values(answers).forEach((val) => {
        const answer = val as Answer;
        if (answer && typeof answer.index === 'number') {
             const idx = answer.index;
             if (idx >= 0 && idx < 4) counts[idx]++;
        }
    });

    const data = question.options.map((opt, i) => ({
        name: i,
        count: counts[i],
        correct: i === question.correctIndex
    }));

    return (
        <div className="w-full md:w-3/4 h-96 bg-black/20 rounded-xl p-8">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="name" tick={false} axisLine={false} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} opacity={index === question.correctIndex ? 1 : 0.3} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
  };

  const renderTextResults = () => {
      // Simple list of recent answers or just stat count
      const correctText = question.options[0].toLowerCase().trim();
      let correctCount = 0;
      Object.values(answers).forEach((val) => {
          const answer = val as Answer;
          if (answer.text && answer.text.toLowerCase().trim() === correctText) correctCount++;
      });

      return (
          <div className="w-full md:w-3/4 h-96 bg-black/20 rounded-xl p-8 flex items-center justify-center flex-col gap-4">
               <div className="text-6xl font-black">{correctCount}</div>
               <div className="text-xl font-bold opacity-80 uppercase">Correct Answers</div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-8 pb-20">
        <div className="flex-1 flex flex-col md:flex-row gap-12 items-end mb-4">
            {isTextType ? renderTextResults() : renderChart()}
            
            <div className="w-full md:w-1/4">
                <div className="bg-white text-gray-900 p-6 rounded-xl shadow-2xl">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Correct Answer</div>
                    <div className="flex items-start gap-3">
                        <Check className="w-8 h-8 text-green-600 shrink-0" />
                        <span className="text-2xl font-bold leading-tight">
                            {isTextType ? question.options[0] : question.options[question.correctIndex]}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <button 
                onClick={onNext}
                className="bg-white text-[#46178f] px-12 py-4 rounded-full font-black text-2xl shadow-lg hover:scale-105 transition"
            >
                {isLast ? "Podium" : "Next"}
            </button>
        </div>
    </div>
  );
};

export default HostResultsScreen;
