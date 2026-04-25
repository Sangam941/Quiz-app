'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { generateAIQuestions } from '@/lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '@/components/Navbar';
import { 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search,
  BookOpen,
  Filter,
  RefreshCw,
  Save,
  ChevronDown,
  Database
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'published';
  subjectId: string;
}

export default function QuestionsAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // AI Generator state
  const [genSubject, setGenSubject] = useState('Economics');
  const [genTopic, setGenTopic] = useState('Market Equilibrium');
  const [genContext, setGenContext] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [bulkJson, setBulkJson] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleGenAI = async () => {
    setGenLoading(true);
    try {
      const topicWithContext = genContext ? `${genTopic} based on this context: ${genContext}` : genTopic;
      const newQuestions = await generateAIQuestions(genSubject, topicWithContext, genCount);
      // Automatically save them as pending
      const savePromises = newQuestions.map((q: any) => 
        addDoc(collection(db, 'questions'), {
          ...q,
          subjectId: genSubject.toLowerCase(),
          topicId: genTopic.toLowerCase().replace(/\s+/g, '-'),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(savePromises);
      await fetchQuestions();
      alert(`Generated and saved ${newQuestions.length} pending questions.`);
    } catch (err) {
      alert('AI Generation failed. Check console.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      const questionsToSave = Array.isArray(parsed) ? parsed : [parsed];
      const savePromises = questionsToSave.map((q: any) => 
        addDoc(collection(db, 'questions'), {
          ...q,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(savePromises);
      await fetchQuestions();
      setBulkJson('');
      setIsBulkMode(false);
      alert('Bulk questions uploaded successfully.');
    } catch (err) {
      alert('Invalid JSON format.');
    }
  };

  const approveQuestion = async (id: string) => {
    await updateDoc(doc(db, 'questions', id), { status: 'published' });
    setQuestions(questions.map(q => q.id === id ? { ...q, status: 'published' } : q));
  };

  const deleteQuestion = async (id: string) => {
    if (confirm('Delete this question permanently?')) {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* AI Generator Sidebar */}
          <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-200">
               <div className="flex justify-between items-start mb-8">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isBulkMode ? 'bg-blue-600' : 'bg-amber-500'}`}>
                    {isBulkMode ? <Database className="h-8 w-8 text-white" /> : <Sparkles className="h-8 w-8 text-white" />}
                  </div>
                  <button 
                    onClick={() => setIsBulkMode(!isBulkMode)}
                    className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline"
                  >
                    Switch to {isBulkMode ? 'AI Mode' : 'Bulk Mode'}
                  </button>
               </div>
               <h2 className="text-3xl font-black mb-2 tracking-tight">{isBulkMode ? 'Bulk Upload' : 'AI Generator'}</h2>
               <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest">{isBulkMode ? 'Paste Question JSON' : 'Instant MCQ Creation'}</p>
               
               <div className="space-y-6">
                  {isBulkMode ? (
                    <div>
                      <textarea 
                        value={bulkJson}
                        onChange={(e) => setBulkJson(e.target.value)}
                        placeholder='[{"text": "Sample?", "options": ["A","B","C","D"], "correctAnswerIndex": 0, "difficulty": "easy", "explanation": "..."}]'
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-mono text-[10px] text-white min-h-[300px]"
                      />
                      <button
                        onClick={handleBulkUpload}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl mt-4 hover:bg-blue-700 transition-all"
                      >
                        Push to Database
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Target Subject</label>
                        <input 
                          type="text" 
                          value={genSubject}
                          onChange={(e) => setGenSubject(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all font-bold text-white"
                          placeholder="e.g. Economics"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Specific Topic</label>
                        <input 
                          type="text" 
                          value={genTopic}
                          onChange={(e) => setGenTopic(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all font-bold text-white"
                          placeholder="e.g. Elasticity of Demand"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Source Materials (Optional)</label>
                        <textarea 
                          placeholder="Paste PDF text or textbook content here to generate context-specific questions..."
                          value={genContext}
                          onChange={(e) => setGenContext(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all font-bold text-white min-h-[80px] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Batch Count</label>
                        <select 
                          value={genCount}
                          onChange={(e) => setGenCount(parseInt(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none appearance-none font-bold"
                        >
                          <option value="5" className="bg-gray-900">5 Questions</option>
                          <option value="10" className="bg-gray-900">10 Questions</option>
                          <option value="20" className="bg-gray-900">20 Questions</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleGenAI}
                        disabled={genLoading}
                        className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {genLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        {genLoading ? 'Processing AI...' : 'Generate Questions'}
                      </button>
                    </>
                  )}
               </div>
            </div>
          </div>

          {/* Main Question List */}
          <div className="lg:w-2/3">
             <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 min-h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                   <div>
                      <h2 className="text-3xl font-black text-gray-900 italic font-serif">Question Bank</h2>
                      <div className="flex gap-4 mt-2">
                        {['all', 'pending', 'published'].map(f => (
                          <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                              filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            {f === 'all' ? `Total (${questions.length})` : f}
                          </button>
                        ))}
                      </div>
                   </div>
                   <button 
                    onClick={fetchQuestions}
                    className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                   >
                     <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                </div>

                {loading ? (
                   <div className="flex items-center justify-center h-64">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : (
                  <div className="space-y-6">
                    {filteredQuestions.map((q, idx) => (
                      <div key={q.id} className="p-8 rounded-[2rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                  q.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {q.status}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{q.difficulty}</span>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 leading-snug pr-20">{q.text}</h4>
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                           {q.options.map((opt, i) => (
                             <div key={i} className={`text-sm font-medium p-3 rounded-xl border ${i === q.correctAnswerIndex ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500'}`}>
                                {opt}
                             </div>
                           ))}
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="h-3 w-3" />
                            Subject: <span className="text-gray-900">{q.subjectId}</span>
                          </div>
                          <div className="flex gap-2">
                            {q.status === 'pending' && (
                              <button 
                                onClick={() => approveQuestion(q.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => deleteQuestion(q.id)}
                              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredQuestions.length === 0 && (
                       <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                          <p className="text-gray-400 font-bold text-sm tracking-tight uppercase">No questions in this filter.</p>
                       </div>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
