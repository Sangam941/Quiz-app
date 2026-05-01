'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Target, 
  Clock, 
  BarChart3, 
  ArrowRight, 
  BookOpen,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalAttempts: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  subjectStats: Record<string, { total: number; correct: number }>;
}

export default function Dashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    subjectStats: {},
  });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function getStats() {
      if (!user) return;
      
      try {
        // Query without orderBy to avoid composite index requirement in dev
        const q = query(
          collection(db, 'attempts'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        // Sort locally instead
        const docs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        
        if (!isMounted) return;

        const newStats: Stats = {
          totalAttempts: docs.length,
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          subjectStats: {},
        };

        const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
        const subjectsMap: Record<string, string> = {};
        subjectsSnapshot.docs.forEach(doc => {
          subjectsMap[doc.id] = doc.data().name;
        });

        // Add subject names to recent attempts
        const attemptsWithSubjects = docs.slice(0, 5).map((attempt: any) => ({
           ...attempt,
           subjectName: subjectsMap[attempt.subjectId] || 'Practice Quiz'
        }));
        setRecentAttempts(attemptsWithSubjects);

        docs.forEach((attempt: any) => {
          newStats.totalQuestions += attempt.totalQuestions;
          newStats.correctAnswers += attempt.score;
          
          const subName = subjectsMap[attempt.subjectId] || attempt.subjectId || 'Other';
          if (!newStats.subjectStats[subName]) {
            newStats.subjectStats[subName] = { total: 0, correct: 0 };
          }
          newStats.subjectStats[subName].total += attempt.totalQuestions;
          newStats.subjectStats[subName].correct += attempt.score;
        });

        newStats.accuracy = newStats.totalQuestions > 0 
          ? Math.round((newStats.correctAnswers / newStats.totalQuestions) * 100) 
          : 0;

        setStats(newStats);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getStats();
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-500/30">
      <Navbar />

      <main className="pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-display">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
            Your learning progression hub • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Quizzes Attempted', value: stats.totalAttempts, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Questions Solved', value: stats.totalQuestions, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Overall Accuracy', value: `${stats.accuracy}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Hours Practiced', value: '12.5', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-[2rem] hover:bg-white/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border ${stat.bg} shadow-lg shadow-black/20`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Active</div>
              </div>
              <div className="text-4xl font-black text-white mb-1 font-display tracking-tight group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="glass-card rounded-[2.5rem] p-10">
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 font-display uppercase tracking-wider">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                Performance Analytics
              </h2>
              {Object.keys(stats.subjectStats).length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-8">
                  {Object.entries(stats.subjectStats).map(([subject, data]) => (
                    <div key={subject} className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                      <div className="flex justify-between mb-3 items-end">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{subject}</span>
                        <span className="text-sm font-bold text-blue-400">{Math.round((data.correct / data.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                          style={{ width: `${(data.correct / data.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/5">
                  <AlertCircle className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No subjects practiced yet</p>
                </div>
              )}
            </div>

            {/* Recent History */}
            <div className="glass-card rounded-[2.5rem] p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-white font-display uppercase tracking-wider">Recent Activity</h2>
                <Link href="/history" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline decoration-2">View Full Archive</Link>
              </div>
              <div className="space-y-3">
                {recentAttempts.length > 0 ? (
                  recentAttempts.map((attempt, i) => (
                    <div key={attempt.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-white">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center transition-transform group-hover:scale-105">
                          <span className="text-lg font-black">{Math.round((attempt.score / attempt.totalQuestions) * 100)}%</span>
                          <span className="text-[7px] uppercase font-black text-slate-500">ACC</span>
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors uppercase tracking-tight">{attempt.subjectName}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                            {new Date(attempt.completedAt).toLocaleDateString()} • {attempt.totalQuestions} Questions
                          </div>
                        </div>
                      </div>
                      <Link href={`/results/${attempt.id}`} className="w-12 h-12 glass-card rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <ArrowRight className="h-5 w-5 text-white" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-16 text-slate-500 text-xs font-black uppercase tracking-widest">You haven&apos;t completed any quizzes yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-500/20 overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tight mb-4 font-display leading-[1.1]">Ready for a <br />Challenge?</h3>
                <p className="text-blue-100 text-sm mb-10 leading-relaxed font-medium">
                  Pick a subject and test your knowledge against AI-generated questions. Optimized for BBA syllabus.
                </p>
                <Link 
                  href="/subjects"
                  className="inline-flex items-center justify-center w-full py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 transition-all group uppercase tracking-widest text-xs"
                >
                  Start New Quiz
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              {/* Decorative elements */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/20 rounded-full blur-[80px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            </div>

            {/* Admin Quick Link */}
            {userData?.role === 'admin' && (
              <div className="bg-amber-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-amber-500/20 relative group overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black tracking-tight mb-4 font-display leading-[1.1]">Admin <br />Dashboard</h3>
                  <p className="text-amber-100 text-sm mb-10 leading-relaxed font-medium">
                    Manage subjects, generate new questions via AI, and moderate the practice bank.
                  </p>
                  <Link 
                    href="/admin"
                    className="inline-flex items-center justify-center w-full py-5 bg-white text-amber-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all group uppercase tracking-widest text-xs"
                  >
                    Enter Control Panel
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-[60px] pointer-events-none" />
              </div>
            )}

            <div className="glass-card rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-4">Subject Mastery</h3>
              <div className="space-y-8">
                {Object.keys(stats.subjectStats).slice(0, 3).map((sub, i) => (
                  <div key={sub} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{sub}</span>
                        <span className="text-[10px] font-bold text-indigo-400">Level {Math.max(1, Math.ceil((stats.subjectStats[sub].correct / stats.subjectStats[sub].total) * 5))}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5].map(star => {
                        const level = Math.max(1, Math.ceil((stats.subjectStats[sub].correct / stats.subjectStats[sub].total) * 5));
                        return (
                          <div key={star} className={`h-1.5 flex-1 rounded-full ${star <= level ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(stats.subjectStats).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Start practicing to track mastery.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
