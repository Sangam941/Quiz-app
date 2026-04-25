'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings2, 
  ListOrdered, 
  Zap, 
  Timer,
  CheckCircle2,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface Subject {
  id: string;
  name: string;
  description: string;
}

interface Topic {
  id: string;
  name: string;
}

export default function QuizSetupPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);

  const fetchData = useCallback(async () => {
    try {
      // Fetch Subject
      const subDoc = await getDoc(doc(db, 'subjects', subjectId));
      if (subDoc.exists()) {
        setSubject({ id: subDoc.id, ...subDoc.data() } as Subject);
      } else {
        // Mock if not found (for initial dev)
        setSubject({ id: subjectId, name: subjectId.charAt(0).toUpperCase() + subjectId.slice(1), description: 'Explore and practice ' + subjectId + ' fundamentals.' });
      }

      // Fetch Topics
      const topicsSnapshot = await getDocs(query(collection(db, `subjects/${subjectId}/topics`)));
      setTopics(topicsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, [subjectId, fetchData]);

  const startQuiz = () => {
    const params = new URLSearchParams({
      subjectId,
      topicId: selectedTopic,
      difficulty,
      count: questionCount.toString(),
    });
    router.push(`/quiz?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-20">
        <Link href="/subjects" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4 italic font-serif">
            Practice: {subject?.name}
          </h1>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            Configure your session. Our AI will curate questions based on your selections.
          </p>
        </header>

        <div className="space-y-8">
          {/* Difficulty Selection */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
              <Zap className="h-4 w-4 text-amber-500" />
              1. Choose Difficulty
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-4 rounded-2xl font-bold capitalize transition-all border-2 ${
                    difficulty === level 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
              <ListOrdered className="h-4 w-4 text-blue-500" />
              2. Number of Questions
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[5, 10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                    questionCount === count 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
                <Settings2 className="h-4 w-4 text-purple-500" />
                3. Topic Focus
              </h3>
              <select 
                value={selectedTopic} 
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="all">Mixed / All Topics</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedTopic('all')}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${
                  selectedTopic === 'all' 
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100' 
                    : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                    <span className="font-black text-gray-900 uppercase tracking-tight">Comprehensive Mix</span>
                    {selectedTopic === 'all' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>
                <p className="text-xs text-gray-500 font-medium relative z-10">Random questions from every available topic in this subject.</p>
              </div>
              {topics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${
                    selectedTopic === topic.id 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-100' 
                      : 'border-gray-100 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <span className="font-black text-gray-900 uppercase tracking-tight">{topic.name}</span>
                    {selectedTopic === topic.id && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-gray-500 font-medium italic relative z-10">Targeted practice covering specifically this area.</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Start */}
          <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h4 className="text-xl font-bold flex items-center gap-2"> Ready to roll? </h4>
              <div className="flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {questionCount * 1} Min Estimated</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {questionCount} Questions</span>
              </div>
            </div>
            <button
              onClick={startQuiz}
              className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group"
            >
              Start Session
              <Play className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
