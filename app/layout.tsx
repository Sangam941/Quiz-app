import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'BizQuiz AI: BBA Practice Platform',
  description: 'AI-powered practice for BBA students',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="overflow-x-hidden selection:bg-blue-500/30">
        <div className="fixed inset-0 z-[-1] bg-slate-950 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -right-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[60px]" />
        </div>
        <AuthProvider>
          <div className="relative z-10 min-h-screen">
            {children}
            <Toaster position="bottom-right" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
