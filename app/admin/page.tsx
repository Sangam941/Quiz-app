'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Users, 
  FileQuestion, 
  Plus, 
  LayoutDashboard, 
  ArrowRight,
  Database,
  BarChart,
  Settings,
  XCircle,
  RefreshCw,
  Library
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export default function AdminDashboard() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    bankQuestions: 0,
    pendingQuestions: 0,
    totalSubjects: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && userData?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, loading, router]);

  useEffect(() => {
    if (!loading && userData?.role === 'admin') {
      const loadStats = async () => {
        try {
          setStatsLoading(true);
          const usersSnap = await getCountFromServer(collection(db, 'users'));
          
          const pubQuery = query(collection(db, 'questions'), where('status', '==', 'published'));
          const pubSnap = await getCountFromServer(pubQuery);
          
          const pendQuery = query(collection(db, 'questions'), where('status', '==', 'pending'));
          const pendSnap = await getCountFromServer(pendQuery);
          
          const subSnap = await getCountFromServer(collection(db, 'subjects'));

          setStats({
            totalUsers: usersSnap.data().count,
            bankQuestions: pubSnap.data().count,
            pendingQuestions: pendSnap.data().count,
            totalSubjects: subSnap.data().count,
          });
        } catch (e) {
          console.error("Failed to fetch admin stats", e);
        } finally {
          setStatsLoading(false);
        }
      };
      
      loadStats();
    }
  }, [loading, userData]);

  if (loading || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-2 block">Control Panel</span>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 italic font-serif">Admin Systems</h1>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-gray-400 capitalize">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Total Users', value: statsLoading ? '...' : stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
             { label: 'Bank Questions', value: statsLoading ? '...' : stats.bankQuestions, icon: FileQuestion, color: 'text-green-600', bg: 'bg-green-100' },
             { label: 'Pending Questions', value: statsLoading ? '...' : stats.pendingQuestions, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100' },
             { label: 'Total Subjects', value: statsLoading ? '...' : stats.totalSubjects, icon: Library, color: 'text-purple-600', bg: 'bg-purple-100' },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
             </div>
           ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <Link 
              href="/admin/questions"
              className="group bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
            >
                <div className="flex justify-between items-start mb-10">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-100">
                        <Plus className="h-8 w-8 text-white" />
                    </div>
                    <Settings className="h-6 w-6 text-gray-100 group-hover:text-gray-200 transition-colors" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Question Engine</h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-10">
                    Manage the practice bank, generate new questions using AI, and moderate pending submissions.
                </p>
                <div className="flex items-center text-blue-600 font-bold gap-2 group-hover:gap-4 transition-all">
                    Manage Questions <ArrowRight className="h-5 w-5" />
                </div>
            </Link>

            <Link 
              href="/admin/subjects"
              className="group bg-gray-900 p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all text-white"
            >
                <div className="flex justify-between items-start mb-10">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                        <LayoutDashboard className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Curriculum Sync</h3>
                <p className="text-gray-400 font-medium leading-relaxed mb-10">
                    Define and update BBA subjects, modules, and learning tracks. Structure the foundation of the platform.
                </p>
                <div className="flex items-center text-amber-500 font-bold gap-2 group-hover:gap-4 transition-all">
                    Update Modules <ArrowRight className="h-5 w-5" />
                </div>
            </Link>
        </div>
      </main>
    </div>
  );
}
