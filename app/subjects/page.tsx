'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { GraduationCap, ArrowRight, Book, Calculator, TrendingUp, Handshake, Landmark } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  Calculator: Calculator,
  TrendingUp: TrendingUp,
  Handshake: Handshake,
  Landmark: Landmark,
  Book: Book,
  GraduationCap: GraduationCap,
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    try {
      const q = query(collection(db, 'subjects'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
      
      // If no subjects, provide defaults for UI demo
      if (data.length === 0) {
        setSubjects([
          { id: 'economics', name: 'Economics', description: 'Macro and Micro economics fundamentals', icon: 'Landmark' },
          { id: 'accounting', name: 'Accounting', description: 'Financial accounting and reporting', icon: 'Calculator' },
          { id: 'marketing', name: 'Marketing', description: 'Consumer behavior and brand strategy', icon: 'TrendingUp' },
          { id: 'business-studies', name: 'Business Studies', description: 'Management and organizational theory', icon: 'Handshake' },
        ]);
      } else {
        setSubjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return (
    <div className="min-h-screen selection:bg-blue-500/30">
      <Navbar />

      <main className="pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        <header className="mb-20">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 block">Knowledge Base</span>
          <h1 className="text-6xl font-black tracking-tight text-white leading-[0.9] mb-6 font-display uppercase">
            Choose Your <br /> Practice <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-400">Specialty.</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
            Select a subject to begin your AI-enhanced learning journey. Each subject contains curated topics and dynamic question banks.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, i) => {
            const Icon = iconMap[subject.icon] || Book;
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  href={`/subjects/${subject.id}`}
                  className="group block p-10 rounded-[2.5rem] glass-card hover:bg-white/10 hover:border-white/30 transition-all h-full flex flex-col justify-between shadow-2xl shadow-black/20"
                >
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                      <Icon className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase font-display group-hover:text-blue-400 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-12">
                      {subject.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-8">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Start Module</span>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all shadow-lg">
                      <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
