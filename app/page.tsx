'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BookOpen, BrainCircuit, Target, Trophy, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-blue-500/30">
      <Navbar />

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <BrainCircuit className="h-3 w-3" />
              Future of Business Education
            </div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white leading-[0.9] mb-8 font-display">
              MASTER BBA <br /> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 drop-shadow-sm">WITH INTELLIGENCE.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 font-medium leading-relaxed mb-12">
              AI-powered practice platform designed specifically for BBA students. 
              Personalized quizzes, real-time analytics, and automated learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/auth"
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-white/10 flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
              >
                Start Practicing 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/subjects"
                className="w-full sm:w-auto px-10 py-5 glass-card text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center uppercase tracking-widest text-xs"
              >
                View Subjects
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative h-[450px] w-full max-w-5xl mx-auto rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-10">
                {[
                  { label: 'Economics', color: 'from-blue-600 to-blue-400', icon: '📊' },
                  { label: 'Accounting', color: 'from-emerald-600 to-emerald-400', icon: '🏦' },
                  { label: 'Mathematics', color: 'from-purple-600 to-purple-400', icon: '∞' },
                  { label: 'Finance', color: 'from-amber-600 to-amber-400', icon: '💰' },
                  { label: 'Marketing', color: 'from-pink-600 to-pink-400', icon: '📢' },
                  { label: 'Business Law', color: 'from-indigo-600 to-indigo-400', icon: '⚖️' },
                ].map((subject, i) => (
                  <motion.div
                    key={subject.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center gap-4 hover:border-white/30 transition-all group cursor-default"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-2xl shadow-lg ring-4 ring-black/20`}>
                      {subject.icon}
                    </div>
                    <span className="font-black text-white uppercase tracking-widest text-[10px]">{subject.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-32 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <BrainCircuit className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">AI-Generated Quizzes</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Our advanced AI models generate curriculum-aligned questions based on specific topics and difficulty levels.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Target className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">Smart Analytics</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Track your performance across subjects. Identify weak areas and monitor your accuracy trends over time.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Trophy className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">Exam Readiness</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                Practice with real exam-like conditions, including timers and detailed explanations for every correct answer.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8 opacity-50 grayscale">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white">Q</div>
            <span className="text-lg font-bold tracking-tight text-white font-display">BizQuiz AI</span>
        </div>
        <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase">
          © 2026 BIZQUIZ AI. DESIGNED FOR THE NEXT GENERATION OF BUSINESS LEADERS.
        </p>
      </footer>
    </div>
  );
}
