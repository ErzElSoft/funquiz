
import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { Plus, Trash2, Save, CheckCircle, Circle, Clock, Type, FileText } from 'lucide-react';

interface Props {
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

const DEFAULT_MC_OPTIONS = ['', '', '', ''];
const DEFAULT_TF_OPTIONS = ['True', 'False'];

const QuizCreator: React.FC<Props> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Current Question State
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [qTime, setQTime] = useState(20);
  const [qOptions, setQOptions] = useState<string[]>([...DEFAULT_MC_OPTIONS]);
  const [qCorrectIdx, setQCorrectIdx] = useState<number | null>(null);
  
  // For text questions
  const [qAnswerText, setQAnswerText] = useState('');

  const resetCurrentQuestion = () => {
    setQText('');
    setQType('MULTIPLE_CHOICE');
    setQTime(20);
    setQOptions(['', '', '', '']);
    setQCorrectIdx(null);
    setQAnswerText('');
  };

  const handleTypeChange = (type: QuestionType) => {
    setQType(type);
    if (type === 'TRUE_FALSE') {
      setQOptions([...DEFAULT_TF_OPTIONS]);
      setQCorrectIdx(null);
      setQAnswerText('');
    } else if (type === 'MULTIPLE_CHOICE') {
      setQOptions(['', '', '', '']);
      setQCorrectIdx(null);
      setQAnswerText('');
    } else {
      // Text types
      setQOptions([]);
      setQCorrectIdx(-1);
      setQAnswerText('');
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...qOptions];
    newOpts[idx] = val;
    setQOptions(newOpts);
  };

  const isTextType = qType === 'SHORT_ANSWER' || qType === 'FILL_IN_THE_BLANK';

  const isFormValid = (() => {
    if (qText.trim().length === 0) return false;
    
    if (isTextType) {
        return qAnswerText.trim().length > 0;
    }

    // MC or TF
    return qCorrectIdx !== null && qOptions.every(o => o.trim().length > 0);
  })();

  const createQuestionObject = (): Question => {
      let finalOptions = [...qOptions];
      // For text types, we store the acceptable answer in the first option slot
      if (isTextType) {
          finalOptions = [qAnswerText.trim()];
      }

      return {
        id: `q-${Date.now()}-${Math.random()}`,
        type: qType,
        text: qText,
        options: finalOptions,
        correctIndex: isTextType ? -1 : qCorrectIdx!,
        timeLimit: qTime
      };
  };

  const addQuestion = () => {
    if (!isFormValid) return;
    setQuestions([...questions, createQuestionObject()]);
    resetCurrentQuestion();
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveQuiz = () => {
    if (!title.trim()) {
        alert("Please add a Quiz Title");
        return;
    }

    let finalQuestions = [...questions];

    // If user has a pending valid question, add it automatically
    if (isFormValid) {
        finalQuestions.push(createQuestionObject());
    }

    if (finalQuestions.length === 0) {
        alert("Please add at least one question");
        return;
    }

    onSave({
      title,
      topic: 'Custom',
      questions: finalQuestions
    });
  };

  const canSave = title.trim().length > 0 && (questions.length > 0 || isFormValid);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-[#46178f]">Create Custom Quiz</h2>
        <div className="flex gap-2">
           <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
           <button 
             onClick={handleSaveQuiz} 
             disabled={!canSave}
             className="bg-[#46178f] text-white px-6 py-2 rounded font-bold hover:bg-[#36107a] disabled:opacity-50 flex items-center gap-2"
           >
             <Save className="w-4 h-4" /> Save & Host
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question List */}
        <div className="w-64 bg-white border-r overflow-y-auto hidden md:block">
           <div className="p-4">
              <label className="block text-sm font-bold text-gray-500 mb-1">Quiz Title</label>
              <input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="My Awesome Quiz"
                className="w-full p-2 border rounded focus:ring-2 ring-[#46178f] outline-none font-bold"
              />
           </div>
           <div className="p-2 space-y-2">
             {questions.map((q, idx) => (
               <div key={q.id} className="p-3 bg-gray-100 rounded group relative hover:bg-gray-200">
                 <div className="text-xs font-bold text-gray-500 mb-1">Q{idx + 1} • {q.type.replace(/_/g, ' ')}</div>
                 <div className="text-sm font-medium truncate pr-6">{q.text}</div>
                 <button 
                   onClick={() => removeQuestion(q.id)}
                   className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {questions.length === 0 && (
               <div className="text-center py-8 text-gray-400 text-sm">No questions added yet</div>
             )}
           </div>
        </div>

        {/* Right: Editor */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
            
            {/* Mobile Title Input */}
            <div className="md:hidden mb-6">
                <label className="block text-sm font-bold text-gray-500 mb-1">Quiz Title</label>
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="My Awesome Quiz"
                  className="w-full p-2 border rounded font-bold"
                />
            </div>

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#46178f]" /> Add New Question
            </h3>

            <div className="space-y-6">
              {/* Question Text */}
              <div>
                <textarea
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder={qType === 'FILL_IN_THE_BLANK' ? "The capital of France is ___" : "Start typing your question..."}
                  className="w-full p-4 text-xl md:text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-[#46178f] outline-none resize-none bg-gray-50 text-center placeholder:text-gray-300"
                  rows={2}
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-wrap justify-center">
                      <button 
                        onClick={() => handleTypeChange('MULTIPLE_CHOICE')}
                        className={`px-3 py-2 rounded-md text-xs font-bold transition flex items-center gap-1 ${qType === 'MULTIPLE_CHOICE' ? 'bg-white shadow text-[#46178f]' : 'text-gray-500'}`}
                      >
                        Quiz
                      </button>
                      <button 
                         onClick={() => handleTypeChange('TRUE_FALSE')}
                         className={`px-3 py-2 rounded-md text-xs font-bold transition flex items-center gap-1 ${qType === 'TRUE_FALSE' ? 'bg-white shadow text-[#46178f]' : 'text-gray-500'}`}
                      >
                        True/False
                      </button>
                      <button 
                         onClick={() => handleTypeChange('SHORT_ANSWER')}
                         className={`px-3 py-2 rounded-md text-xs font-bold transition flex items-center gap-1 ${qType === 'SHORT_ANSWER' ? 'bg-white shadow text-[#46178f]' : 'text-gray-500'}`}
                      >
                        <Type className="w-3 h-3" /> Short
                      </button>
                      <button 
                         onClick={() => handleTypeChange('FILL_IN_THE_BLANK')}
                         className={`px-3 py-2 rounded-md text-xs font-bold transition flex items-center gap-1 ${qType === 'FILL_IN_THE_BLANK' ? 'bg-white shadow text-[#46178f]' : 'text-gray-500'}`}
                      >
                        <FileText className="w-3 h-3" /> Blank
                      </button>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                     <Clock className="w-4 h-4 text-gray-500" />
                     <select 
                       value={qTime}
                       onChange={e => setQTime(Number(e.target.value))}
                       className="bg-transparent font-bold outline-none cursor-pointer"
                     >
                        <option value={10}>10 sec</option>
                        <option value={20}>20 sec</option>
                        <option value={30}>30 sec</option>
                        <option value={60}>60 sec</option>
                     </select>
                  </div>
              </div>

              {/* Answer Input Area */}
              {isTextType ? (
                 <div className="mt-8">
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase text-center">Correct Answer</label>
                    <input 
                        value={qAnswerText}
                        onChange={e => setQAnswerText(e.target.value)}
                        placeholder="Type the exact answer here..."
                        className="w-full max-w-lg mx-auto block p-4 text-xl font-bold border-2 border-green-500 rounded-lg focus:ring-4 focus:ring-green-200 outline-none text-center text-green-700 bg-green-50"
                    />
                    <p className="text-center text-xs text-gray-400 mt-2">Answers will be checked case-insensitive.</p>
                 </div>
              ) : (
                /* MC / TF Options */
                <div className={`grid gap-4 mt-8 ${qType === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {qOptions.map((opt, idx) => {
                        const isSelected = qCorrectIdx === idx;
                        const colors = [
                            'border-red-500 bg-red-50',
                            'border-blue-500 bg-blue-50',
                            'border-yellow-500 bg-yellow-50',
                            'border-green-500 bg-green-50'
                        ];
                        
                        return (
                        <div 
                            key={idx} 
                            className={`relative group transition-all duration-200 ${isSelected ? 'scale-[1.02]' : ''}`}
                        >
                            <div className={`flex items-center border-2 rounded-lg overflow-hidden bg-white shadow-sm ${isSelected ? colors[idx] : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className={`w-10 h-full flex items-center justify-center font-bold text-white
                                ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-yellow-500' : 'bg-green-500'}
                            `}>
                                {idx === 0 ? '▲' : idx === 1 ? '◆' : idx === 2 ? '●' : '■'}
                            </div>
                            
                            <input
                                value={opt}
                                onChange={e => handleOptionChange(idx, e.target.value)}
                                readOnly={qType === 'TRUE_FALSE'}
                                placeholder={`Answer ${idx + 1}`}
                                className={`flex-1 p-4 font-bold outline-none ${qType === 'TRUE_FALSE' ? 'cursor-default' : ''} ${isSelected ? 'bg-transparent' : 'bg-white'}`}
                            />

                            <button
                                onClick={() => setQCorrectIdx(idx)}
                                className={`p-4 hover:bg-black/5 transition ${isSelected ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                                title="Mark as correct answer"
                            >
                                {isSelected ? <CheckCircle className="w-6 h-6 fill-current" /> : <Circle className="w-6 h-6" />}
                            </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                  <button
                    onClick={addQuestion}
                    disabled={!isFormValid}
                    className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100"
                  >
                    Add Question
                  </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;
