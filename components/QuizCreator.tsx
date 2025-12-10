
import React, { useState } from 'react';
import { Quiz, Question, QuestionType } from '../types';
import { Plus, Trash2, Save, CheckCircle, Circle, Clock, Type, FileText, ArrowLeft, LayoutGrid, ToggleLeft, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveQuiz } from '../services/quizService';

interface Props {
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

const DEFAULT_MC_OPTIONS = ['', '', '', ''];
const DEFAULT_TF_OPTIONS = ['True', 'False'];

const QuizCreator: React.FC<Props> = ({ onSave, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
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

  const handleSaveToLibrary = async () => {
    if (!user) {
      setSaveMessage({ type: 'error', text: 'You must be logged in to save quizzes' });
      return;
    }

    if (!title.trim()) {
      setSaveMessage({ type: 'error', text: 'Please add a Quiz Title' });
      return;
    }

    let finalQuestions = [...questions];

    // If user has a pending valid question, add it automatically
    if (isFormValid) {
      finalQuestions.push(createQuestionObject());
      resetCurrentQuestion();
    }

    if (finalQuestions.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please add at least one question' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await saveQuiz(user.uid, {
        title,
        topic: 'Custom',
        questions: finalQuestions
      });
      
      setSaveMessage({ type: 'success', text: 'Quiz saved successfully!' });
      setQuestions(finalQuestions);
      
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving quiz:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save quiz. Please try again.' });
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-3">
          {saveMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              saveMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {saveMessage.text}
            </div>
          )}
          <button 
            onClick={handleSaveToLibrary} 
            disabled={!canSave || saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-lg"
          >
            <Database className="w-4 h-4" /> {saving ? 'Saving...' : 'Save to Library'}
          </button>
          <button 
            onClick={handleSaveQuiz} 
            disabled={!canSave}
            className="bg-white text-[#46178f] px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" /> Save & Host
          </button>
        </div>
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
                  className="w-full bg-transparent text-2xl md:text-4xl font-semibold text-center text-white placeholder-white/50 outline-none resize-none h-32"
                />
              </div>

              {/* Controls Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Type Selector */}
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <label className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-3 block">Question Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'MULTIPLE_CHOICE', label: 'Quiz', icon: LayoutGrid },
                            { id: 'TRUE_FALSE', label: 'True/False', icon: ToggleLeft },
                            { id: 'SHORT_ANSWER', label: 'Short Answer', icon: Type },
                            { id: 'FILL_IN_THE_BLANK', label: 'Fill Blank', icon: FileText },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleTypeChange(type.id as QuestionType)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${
                                    qType === type.id 
                                    ? 'bg-white text-[#46178f] shadow-lg scale-105' 
                                    : 'bg-black/20 text-white/60 hover:bg-black/30 hover:text-white'
                                }`}
                            >
                                <type.icon className="w-4 h-4" /> {type.label}
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
                    <p className="text-white/80 text-sm font-semibold">{isTextType ? "Players must type this exactly" : "Click the circle to mark correct answer"}</p>
                  </div>

                  {isTextType ? (
                      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
                          <input 
                            value={qAnswerText}
                            onChange={e => setQAnswerText(e.target.value)}
                            placeholder="Type the correct answer here..."
                            className="w-full bg-black/20 border-2 border-white/10 rounded-xl p-6 text-center text-3xl font-semibold text-white placeholder-white/50 focus:border-green-400 focus:bg-black/40 outline-none transition-all"
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
                                        <div className={`w-14 h-full flex items-center justify-center ${baseColor} min-h-[80px]`}>
                                            <span className="text-2xl font-bold text-white/90">
                                                {qType === 'TRUE_FALSE' ? (idx === 0 ? 'T' : 'F') : ['▲', '◆', '●', '■'][idx]}
                                            </span>
                                        </div>
                                        <div className="flex-1 bg-white relative">
                                            <input
                                                value={opt}
                                                onChange={e => handleOptionChange(idx, e.target.value)}
                                                readOnly={qType === 'TRUE_FALSE'}
                                                placeholder={`Option ${idx + 1}`}
                                                className={`w-full h-full p-4 text-gray-900 font-semibold text-lg outline-none placeholder-gray-400 ${qType === 'TRUE_FALSE' ? 'cursor-default' : ''}`}
                                            />
                                            <button
                                                onClick={() => setQCorrectIdx(idx)}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isSelected ? 'text-green-500 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
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
