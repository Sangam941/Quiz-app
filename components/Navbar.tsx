'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, LogOut, User, ShieldCheck, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, userData } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl group-hover:scale-110 transition-transform">
              Q
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-display">BizQuiz AI</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-[11px]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {userData?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="text-sm font-bold text-amber-500/80 hover:text-amber-400 flex items-center gap-2 transition-colors uppercase tracking-widest text-[11px]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <User className="h-5 w-5" />
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="text-sm font-bold text-slate-500 hover:text-red-400 flex items-center gap-2 transition-colors uppercase tracking-widest text-[11px]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-6 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:scale-105 transition-all shadow-xl shadow-white/5 uppercase tracking-widest text-[11px]"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
