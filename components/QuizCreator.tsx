
import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { Plus, Trash2, Save, CheckCircle, Circle, Type, FileText, ArrowLeft, LayoutGrid, ToggleLeft, Image as ImageIcon, Upload, X } from 'lucide-react';

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
    } else if (type === 'IMAGE_CHOICE') {
      setQOptions(['', '', '', '']); // Empty strings for Base64 data
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

  const handleImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        handleOptionChange(idx, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const isTextType = qType === 'SHORT_ANSWER' || qType === 'FILL_IN_THE_BLANK';

  const isFormValid = (() => {
    if (qText.trim().length === 0) return false;
    
    if (isTextType) {
        return qAnswerText.trim().length > 0;
    }

    // MC or TF or IMAGE
    // For Image choice, options must have content (base64 string)
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
    <div className="flex flex-col h-screen text-white relative z-10">
      
      {/* Top Bar */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-purple-300" /> Quiz Creator
            </h2>
        </div>
        <button 
             onClick={handleSaveQuiz} 
             disabled={!canSave}
             className="bg-white text-[#46178f] px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-lg"
           >
             <Save className="w-4 h-4" /> Save & Host
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar */}
        <div className="w-72 bg-black/20 backdrop-blur-sm border-r border-white/10 overflow-y-auto hidden md:flex flex-col">
           <div className="p-6 border-b border-white/10">
              <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">Quiz Title</label>
              <input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="My Awesome Quiz"
                className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white placeholder-white/30 font-bold focus:border-purple-400 focus:outline-none transition-colors"
              />
           </div>
           
           <div className="flex-1 p-4 space-y-3 overflow-y-auto">
             {questions.map((q, idx) => (
               <div key={q.id} className="p-4 bg-white/5 border border-white/10 rounded-xl group relative hover:bg-white/10 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-purple-300 uppercase">Question {idx + 1}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                        className="text-white/30 hover:text-red-400 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="text-sm font-medium truncate opacity-80">{q.text}</div>
                 <div className="mt-2 flex gap-2">
                    <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-white/60">{q.type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-white/60">{q.timeLimit}s</span>
                 </div>
               </div>
             ))}
             {questions.length === 0 && (
               <div className="text-center py-12 text-white/30 text-sm border-2 border-dashed border-white/10 rounded-xl m-2">
                  No questions yet
               </div>
             )}
           </div>

           <div className="p-4 border-t border-white/10">
                <button
                    onClick={addQuestion}
                    disabled={!isFormValid}
                    className="w-full bg-purple-600/50 hover:bg-purple-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" /> Add Question
                </button>
           </div>
        </div>

        {/* Right: Editor Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           {/* Mobile Title */}
           <div className="md:hidden mb-6">
              <input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter Quiz Title..."
                className="w-full bg-transparent border-b border-white/20 py-2 text-2xl font-black text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
              />
           </div>

           <div className="max-w-4xl mx-auto space-y-8 pb-20">
              
              {/* Question Text */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10">
                 <textarea
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder={qType === 'FILL_IN_THE_BLANK' ? "The capital of France is ___" : "Start typing your question..."}
                  className="w-full bg-transparent text-2xl md:text-4xl font-black text-center text-white placeholder-white/20 outline-none resize-none h-32"
                />
              </div>

              {/* Controls Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Type Selector */}
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <label className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-3 block">Question Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'MULTIPLE_CHOICE', label: 'Quiz', icon: LayoutGrid },
                            { id: 'TRUE_FALSE', label: 'True/False', icon: ToggleLeft },
                            { id: 'IMAGE_CHOICE', label: 'Image', icon: ImageIcon },
                            { id: 'SHORT_ANSWER', label: 'Short Ans', icon: Type },
                            { id: 'FILL_IN_THE_BLANK', label: 'Fill Blank', icon: FileText },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleTypeChange(type.id as QuestionType)}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs font-bold transition-all ${
                                    qType === type.id 
                                    ? 'bg-white text-[#46178f] shadow-lg scale-105' 
                                    : 'bg-black/20 text-white/60 hover:bg-black/30 hover:text-white'
                                }`}
                            >
                                <type.icon className="w-5 h-5" /> <span className="text-center leading-none">{type.label}</span>
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Timer Selector */}
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <label className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-3 block">Time Limit</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 30, 60].map((t) => (
                            <button
                                key={t}
                                onClick={() => setQTime(t)}
                                className={`p-3 rounded-lg text-sm font-bold transition-all ${
                                    qTime === t 
                                    ? 'bg-white text-[#46178f] shadow-lg' 
                                    : 'bg-black/20 text-white/60 hover:bg-black/30 hover:text-white'
                                }`}
                            >
                                {t}s
                            </button>
                        ))}
                    </div>
                 </div>
              </div>

              {/* Answers Area */}
              <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                        {isTextType ? "Set Correct Answer" : "Set Options"}
                    </h3>
                    <p className="text-white/50 text-sm">
                       {isTextType && "Players must type this exactly"}
                       {!isTextType && qType !== 'IMAGE_CHOICE' && "Click circle to mark correct"}
                       {qType === 'IMAGE_CHOICE' && "Upload images and click circle to mark correct"}
                    </p>
                  </div>

                  {isTextType ? (
                      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
                          <input 
                            value={qAnswerText}
                            onChange={e => setQAnswerText(e.target.value)}
                            placeholder="Type the correct answer here..."
                            className="w-full bg-black/20 border-2 border-white/10 rounded-xl p-6 text-center text-3xl font-black text-white placeholder-white/20 focus:border-green-400 focus:bg-black/40 outline-none transition-all"
                          />
                          <div className="mt-4 flex justify-center">
                              <span className="bg-green-500/20 text-green-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-500/30">
                                  Case Insensitive Match
                              </span>
                          </div>
                      </div>
                  ) : (
                      <div className={`grid gap-4 ${qType === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {qOptions.map((opt, idx) => {
                            const isSelected = qCorrectIdx === idx;
                            const colors = [
                                'bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'
                            ];
                            const baseColor = qType === 'TRUE_FALSE' ? (idx === 0 ? 'bg-blue-600' : 'bg-red-600') : colors[idx];
                            
                            return (
                                <div key={idx} className={`relative group transition-transform duration-200 ${isSelected ? 'scale-[1.02]' : ''}`}>
                                    <div className={`flex items-center rounded-2xl overflow-hidden shadow-lg border-2 ${isSelected ? 'border-white' : 'border-transparent'}`}>
                                        <div className={`w-14 self-stretch flex items-center justify-center ${baseColor} min-h-[80px]`}>
                                            <span className="text-2xl font-bold text-white/90">
                                                {qType === 'TRUE_FALSE' ? (idx === 0 ? 'T' : 'F') : ['▲', '◆', '●', '■'][idx]}
                                            </span>
                                        </div>
                                        <div className="flex-1 bg-white relative h-32">
                                            {qType === 'IMAGE_CHOICE' ? (
                                                <div className="w-full h-full relative bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                    {opt ? (
                                                        <>
                                                            <img src={opt} alt="Option" className="w-full h-full object-cover" />
                                                            <button 
                                                                onClick={() => handleOptionChange(idx, "")}
                                                                className="absolute top-2 left-2 bg-black/50 hover:bg-red-500 p-1 rounded-full text-white transition-colors z-10"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <Upload className="w-8 h-8 mb-1" />
                                                            <span className="text-xs font-bold">Upload Image</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleImageUpload(idx, e)}
                                                    />
                                                </div>
                                            ) : (
                                                <input
                                                    value={opt}
                                                    onChange={e => handleOptionChange(idx, e.target.value)}
                                                    readOnly={qType === 'TRUE_FALSE'}
                                                    placeholder={`Option ${idx + 1}`}
                                                    className={`w-full h-full p-4 text-gray-900 font-bold text-lg outline-none ${qType === 'TRUE_FALSE' ? 'cursor-default' : ''}`}
                                                />
                                            )}
                                            
                                            <button
                                                onClick={() => setQCorrectIdx(idx)}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-20 shadow-sm bg-white/50 hover:bg-white ${isSelected ? 'text-green-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {isSelected ? <CheckCircle className="w-8 h-8 fill-current" /> : <Circle className="w-8 h-8" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                  )}
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;
