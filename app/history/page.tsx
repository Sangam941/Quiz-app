'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { 
  Trophy, 
  ArrowRight, 
  Calendar,
  ChevronRight,
  Clock,
  History
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      // Query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user?.uid)
      );
      const snapshot = await getDocs(q);
      
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsMap: Record<string, string> = {};
      subjectsSnapshot.docs.forEach(doc => {
        subjectsMap[doc.id] = doc.data().name;
      });

      const data = snapshot.docs
        .map(doc => {
          const attemptData = doc.data();
          return { 
            id: doc.id, 
            ...attemptData,
            subjectName: subjectsMap[attemptData.subjectId] || 'Practice Quiz'
          };
        })
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      
      setAttempts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setTimeout(() => fetchHistory(), 0);
    }
  }, [user, fetchHistory]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-4">
                <History className="h-3 w-3" />
                Session Archive
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 italic font-serif">Practice History</h1>
        </header>

        <div className="space-y-4">
            {attempts.length > 0 ? (
                attempts.map((attempt, i) => {
                    const accuracy = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    return (
                        <motion.div
                            key={attempt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link 
                                href={`/results/${attempt.id}`}
                                className="group block bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-black ${
                                            accuracy >= 70 ? 'bg-green-50 text-green-600' : accuracy >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                            <span className="text-xl">{accuracy}%</span>
                                            <span className="text-[8px] uppercase tracking-tighter">Accuracy</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase pr-4">
                                                {attempt.subjectName}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(attempt.completedAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                                    <Trophy className="h-3 w-3" />
                                                    {attempt.score}/{attempt.totalQuestions}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-gray-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })
            ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No practice sessions found.</p>
                    <Link href="/subjects" className="mt-6 inline-block text-blue-600 font-bold hover:underline">Start your first quiz</Link>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
