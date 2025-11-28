import React from 'react';
import { Question } from '../types';
import { Check } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  question: Question;
  answers: Record<string, number>; // playerId -> optionIndex
  onNext: () => void;
  isLastQuestion: boolean;
}

const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e']; // Red, Blue, Yellow, Green

const Results: React.FC<Props> = ({ question, answers, onNext, isLastQuestion }) => {

  // Calculate stats
  const distribution = [0, 0, 0, 0];
  Object.values(answers).forEach((val) => {
    const idx = val as number;
    if (idx >= 0 && idx < 4) distribution[idx]++;
  });

  const chartData = question.options.map((opt, idx) => ({
    name: idx,
    count: distribution[idx],
    isCorrect: idx === question.correctIndex
  }));

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2">{question.text}</h2>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-end justify-center mb-12">
        <div className="w-full md:w-2/3 h-64 md:h-96 bg-white/5 rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={false} axisLine={false} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    opacity={index === question.correctIndex ? 1 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/3 space-y-4">
          <div className="text-xl font-semibold opacity-80 mb-4">Correct Answer:</div>
          <div className={`p-6 rounded-lg shadow-xl flex items-center gap-4 ${COLORS[question.correctIndex]}`}>
             <Check className="w-10 h-10 text-white bg-black/20 rounded p-1" />
             <span className="text-2xl font-bold">{question.options[question.correctIndex]}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-white text-[#46178f] px-8 py-3 rounded-full font-bold text-xl hover:bg-gray-100 shadow-lg transition"
        >
          {isLastQuestion ? "Show Podium" : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default Results;