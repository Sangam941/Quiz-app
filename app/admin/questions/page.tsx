'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { generateAIQuestions } from '@/lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit3,
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
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genTopic, setGenTopic] = useState('Market Equilibrium');
  const [genContext, setGenContext] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [bulkJson, setBulkJson] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manual Question state
  const [manualQ, setManualQ] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    explanation: '',
    subjectId: '',
    topicId: ''
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const fetchSubjects = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subjects'));
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (active) {
      setTimeout(() => {
        fetchQuestions();
        fetchSubjects();
      }, 0);
    }
    return () => { active = false; };
  }, [fetchQuestions, fetchSubjects]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQ.text || !manualQ.subjectId || manualQ.options.some(o => !o)) {
      toast.error('Please fill all required fields (Text, Subject, and all 4 Options)');
      return;
    }

    setGenLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'questions', editingId), {
          ...manualQ,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Question updated successfully!');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'questions'), {
          ...manualQ,
          status: 'published',
          createdAt: new Date().toISOString(),
        });
        toast.success('Question added successfully!');
      }
      
      setManualQ({
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        difficulty: 'medium',
        explanation: '',
        subjectId: manualQ.subjectId, // Keep same subject for faster entry
        topicId: ''
      });
      fetchQuestions();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setManualQ({
      text: q.text,
      options: [...q.options],
      correctAnswerIndex: q.correctAnswerIndex,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      subjectId: q.subjectId,
      topicId: q.subjectId // reusing subjectId for now
    });
    setIsManualMode(true);
    setIsBulkMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelManual = () => {
    setEditingId(null);
    setManualQ({
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      difficulty: 'medium',
      explanation: '',
      subjectId: '',
      topicId: ''
    });
    if (editingId) {
      setIsManualMode(false);
    }
  };

  const handleGenAI = async () => {
    if (!genSubjectId) {
      toast.error('Please select a subject first.');
      return;
    }
    setGenLoading(true);
    try {
      const selectedSubject = subjects.find(s => s.id === genSubjectId);
      const subjectName = selectedSubject ? selectedSubject.name : 'Business';
      
      const topicWithContext = genContext ? `${genTopic} based on this context: ${genContext}` : genTopic;
      const newQuestions = await generateAIQuestions(subjectName, topicWithContext, genCount);
      const savePromises = newQuestions.map((q: any) => 
        addDoc(collection(db, 'questions'), {
          ...q,
          subjectId: genSubjectId,
          topicId: genTopic.toLowerCase().replace(/\s+/g, '-'),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(savePromises);
      await fetchQuestions();
      toast.success(`Generated and saved ${newQuestions.length} pending questions.`);
    } catch (err) {
      console.error(err);
      toast.error('AI Generation failed. Check console.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      const questionsToSave = Array.isArray(parsed) ? parsed : [parsed];
      
      for (const q of questionsToSave) {
        let actualSubjectId = q.subjectId;
        
        if (q.subjectName && !actualSubjectId) {
          const lowerName = q.subjectName.toLowerCase().trim();
          const existingSubject = subjects.find(s => s.name.toLowerCase().trim() === lowerName);
          if (existingSubject) {
            actualSubjectId = existingSubject.id;
          } else {
            const newSubDoc = await addDoc(collection(db, 'subjects'), {
              name: q.subjectName.trim(),
              description: `Imported subject for ${q.subjectName}`,
              icon: 'BookOpen',
              createdAt: new Date().toISOString()
            });
            actualSubjectId = newSubDoc.id;
            subjects.push({ id: actualSubjectId, name: q.subjectName.trim() });
          }
        }
        
        await addDoc(collection(db, 'questions'), {
          ...q,
          subjectId: actualSubjectId || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
      
      await fetchQuestions();
      await fetchSubjects();
      setBulkJson('');
      setIsBulkMode(false);
      toast.success('Bulk questions uploaded successfully.');
    } catch (err) {
      toast.error('Invalid JSON format.');
    }
  };

  const approveQuestion = async (id: string) => {
    try {
      await updateDoc(doc(db, 'questions', id), { status: 'published' });
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'published' } : q));
      toast.success('Question published!');
    } catch (err: any) {
      toast.error('Failed to approve: ' + err.message);
    }
  };

  const deleteQuestion = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'questions', deleteId));
      setQuestions(prev => prev.filter(q => q.id !== deleteId));
      setDeleteId(null);
      toast.success('Question deleted.');
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const approveAllPending = () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending');
    if (pendingQuestions.length === 0) return;
    setShowApproveModal(true);
  };

  const confirmApproveAll = async () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending');
    if (pendingQuestions.length === 0) {
      setShowApproveModal(false);
      return;
    }
    
    setIsApprovingAll(true);
    try {
      const promises = pendingQuestions.map(q => 
        updateDoc(doc(db, 'questions', q.id), { status: 'published' })
      );
      await Promise.all(promises);
      setQuestions(prev => prev.map(q => q.status === 'pending' ? { ...q, status: 'published' } : q));
      toast.success('All questions approved!');
      setShowApproveModal(false);
    } catch (err: any) {
      toast.error('Bulk approval failed: ' + err.message);
    } finally {
      setIsApprovingAll(false);
    }
  };

  const deleteAllPending = () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending');
    if (pendingQuestions.length === 0) return;
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = async () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending');
    if (pendingQuestions.length === 0) {
      setShowDeleteAllModal(false);
      return;
    }
    
    setIsDeletingAll(true);
    try {
      const promises = pendingQuestions.map(q => 
        deleteDoc(doc(db, 'questions', q.id))
      );
      await Promise.all(promises);
      setQuestions(prev => prev.filter(q => q.status !== 'pending'));
      toast.success('All pending questions erased!');
      setShowDeleteAllModal(false);
    } catch (err: any) {
      toast.error('Bulk deletion failed: ' + err.message);
    } finally {
      setIsDeletingAll(false);
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
          
          {/* Entry Sidebar */}
          <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-200">
               <div className="flex flex-wrap gap-2 mb-8 p-1 bg-white/5 rounded-xl">
                  <button 
                    onClick={() => { setIsBulkMode(false); setIsManualMode(false); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!isBulkMode && !isManualMode ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    AI
                  </button>
                  <button 
                    onClick={() => { setIsBulkMode(false); setIsManualMode(true); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isManualMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Manual
                  </button>
                  <button 
                    onClick={() => { setIsBulkMode(true); setIsManualMode(false); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isBulkMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Bulk
                  </button>
               </div>
               
               <h2 className="text-3xl font-black mb-2 tracking-tight">
                  {editingId ? 'Edit Question' : isManualMode ? 'Manual Entry' : isBulkMode ? 'Bulk Upload' : 'AI Generator'}
               </h2>
               <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest">
                  {editingId ? 'Updating existing record' : isManualMode ? 'Add One Question' : isBulkMode ? 'Paste Question JSON' : 'Instant MCQ Creation'}
               </p>
               
               <div className="space-y-6">
                  {isManualMode ? (
                     <form onSubmit={handleManualSubmit} className="space-y-5">
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Subject</label>
                          <select 
                            value={manualQ.subjectId}
                            onChange={(e) => setManualQ({...manualQ, subjectId: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-white appearance-none"
                          >
                             <option value="" className="bg-gray-900">Select Subject</option>
                             {subjects.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Question Text</label>
                          <textarea 
                            value={manualQ.text}
                            onChange={(e) => setManualQ({...manualQ, text: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-white min-h-[80px]"
                            placeholder="Type question here..."
                          />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Options (Click circle to set correct)</label>
                           {manualQ.options.map((opt, idx) => (
                              <div key={idx} className="flex gap-2">
                                 <button 
                                   type="button"
                                   onClick={() => setManualQ({...manualQ, correctAnswerIndex: idx})}
                                   className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${manualQ.correctAnswerIndex === idx ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                 >
                                    {String.fromCharCode(65 + idx)}
                                 </button>
                                 <input 
                                   type="text"
                                   value={opt}
                                   onChange={(e) => {
                                      const newOps = [...manualQ.options];
                                      newOps[idx] = e.target.value;
                                      setManualQ({...manualQ, options: newOps});
                                   }}
                                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-all font-bold text-white text-sm"
                                   placeholder={`Option ${idx + 1}`}
                                 />
                              </div>
                           ))}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Explanation</label>
                          <textarea 
                            value={manualQ.explanation}
                            onChange={(e) => setManualQ({...manualQ, explanation: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-all font-bold text-white text-sm"
                            placeholder="Why is it correct?"
                          />
                        </div>
                        <div className="flex gap-3">
                           <button
                             type="submit"
                             disabled={genLoading}
                             className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                             {genLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : editingId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                             {genLoading ? 'Saving...' : editingId ? 'Update' : 'Add Question'}
                           </button>
                           {(editingId || manualQ.text) && (
                             <button
                               type="button"
                               onClick={cancelManual}
                               className="px-6 py-4 bg-white/10 text-gray-400 font-bold rounded-2xl hover:text-white transition-all"
                             >
                               Cancel
                             </button>
                           )}
                        </div>
                     </form>
                  ) : isBulkMode ? (
                    <div>
                      <textarea 
                        value={bulkJson}
                        onChange={(e) => setBulkJson(e.target.value)}
                        placeholder={`[
  {
    "text": "What does CPU stand for?",
    "options": ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Control Processing Unit"],
    "correctAnswerIndex": 0,
    "difficulty": "easy",
    "explanation": "CPU stands for Central Processing Unit.",
    "subjectName": "Computer"
  }
]`}
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
                        <select 
                          value={genSubjectId}
                          onChange={(e) => setGenSubjectId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all font-bold text-white appearance-none"
                        >
                           <option value="" className="bg-gray-900">Select Subject</option>
                           {subjects.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>)}
                        </select>
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
                      <div className="flex flex-wrap gap-4 mt-2">
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
                        {questions.some(q => q.status === 'pending') && (
                          <>
                            <button 
                              onClick={approveAllPending}
                              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all border border-green-600"
                            >
                              Approve All Pending
                            </button>
                            <button 
                              onClick={deleteAllPending}
                              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all border border-red-600"
                            >
                              Delete All Pending
                            </button>
                          </>
                        )}
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
                            Subject: <span className="text-gray-900">{subjects.find(s => s.id === q.subjectId)?.name || q.subjectId}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEdit(q)}
                              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                              title="Edit Question"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
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
                              onClick={() => setDeleteId(q.id)}
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Erase Question?</h3>
              <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed">
                This will permanently remove this question from the question bank. This action cannot be reversed.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeleting}
                  onClick={deleteQuestion}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Erase it'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isApprovingAll && setShowApproveModal(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Approve All?</h3>
              <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed">
                You are about to publish all <b>{questions.filter(q => q.status === 'pending').length}</b> pending questions. This will make them visible to students.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={isApprovingAll}
                  onClick={confirmApproveAll}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isApprovingAll ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Approving...
                    </>
                  ) : 'Yes, Publish All'}
                </button>
                <button
                  disabled={isApprovingAll}
                  onClick={() => setShowApproveModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Erase Pending Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isDeletingAll && setShowDeleteAllModal(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Erase All Pending?</h3>
              <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed">
                You are about to erase all <b>{questions.filter(q => q.status === 'pending').length}</b> pending questions. This action cannot be reversed.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeletingAll}
                  onClick={confirmDeleteAll}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingAll ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Erasing...
                    </>
                  ) : 'Yes, Erase All'}
                </button>
                <button
                  disabled={isDeletingAll}
                  onClick={() => setShowDeleteAllModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
