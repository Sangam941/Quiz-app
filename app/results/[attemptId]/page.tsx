'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  Trophy, 
  Target, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Info,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface Attempt {
  id: string;
  userId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: string;
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
}

export default function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const [attempt, setAttempt] = useState<(Attempt & { subjectName: string }) | null>(null);
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function getResults() {
      setLoading(true);
      try {
        const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
        if (!active) return;
        if (attemptDoc.exists()) {
          const attemptData = attemptDoc.data();
          let subjectName = attemptData.subjectId;
          try {
            const subjectDoc = await getDoc(doc(db, 'subjects', attemptData.subjectId));
            if (subjectDoc.exists()) {
              subjectName = subjectDoc.data().name;
            }
          } catch (e) {
            console.error("Failed to fetch subject", e);
          }

          const data = { id: attemptDoc.id, ...attemptData, subjectName } as Attempt & { subjectName: string };
          
          const mockPool = [
              { text: 'What is the primary goal of Macroeconomics?', options: ['Individual income', 'Overall economy performance', 'Company profits', 'Household savings'], correct: 1, explanation: 'Macroeconomics deals with performance of economy as a whole.' },
              { text: 'Which of the following is NOT an asset?', options: ['Cash', 'Accounts Receivable', 'Loan Payable', 'Inventory'], correct: 2, explanation: 'Loan Payable is a liability.' },
              { text: 'What does GDP stand for?', options: ['Gross Domestic Product', 'General Data Process', 'Global Development Program', 'Gross Deposit Plan'], correct: 0, explanation: 'GDP is the market value of all final goods and services produced within a country.' },
              { text: 'Who is known as the father of Economics?', options: ['Keynes', 'Adam Smith', 'Karl Marx', 'Alfred Marshall'], correct: 1, explanation: 'Adam Smith published The Wealth of Nations in 1776.' },
              { text: 'Inflation is defined as:', options: ['Decrease in prices', 'Increase in purchasing power', 'Sustained increase in general price level', 'Fall in employment'], correct: 2, explanation: 'Inflation reduces the value of money over time.' },
              { text: 'A budget deficit occurs when:', options: ['Revenue exceeds spending', 'Spending exceeds revenue', 'Imports exceed exports', 'Debt is zero'], correct: 1, explanation: 'It means the government is spending more than it collects in taxes.' },
              { text: 'The law of demand states that:', options: ['Price up, demand up', 'Price up, demand down', 'Supply equals demand', 'Income increases demand'], correct: 1, explanation: 'Ceteris paribus, as price rises, quantity demanded falls.' },
              { text: 'Which is a fixed cost?', options: ['Raw materials', 'Direct labor', 'Rent', 'Electricity bill'], correct: 2, explanation: 'Fixed costs do not change with the level of production.' },
              { text: 'What is opportunity cost?', options: ['Direct monetary cost', 'The value of the next best alternative given up', 'Sunken cost', 'Fixed production cost'], correct: 1, explanation: 'It represents the benefit you could have received by taking an alternative action.' },
              { text: 'What is a monopoly?', options: ['Market with many sellers', 'Market with two sellers', 'Market with only one seller', 'Market with no sellers'], correct: 2, explanation: 'A monopoly exists when a single company is the sole provider of a good or service.' }
          ];

          const questionMap: Record<string, Question> = {};
          
          if (data.answers && data.answers.length > 0) {
            const fetchPromises = data.answers.map(async (ans) => {
              // Handle mock IDs
              if (ans.questionId.startsWith('mock-')) {
                const index = parseInt(ans.questionId.split('-')[1]);
                const poolItem = mockPool[index % mockPool.length] || mockPool[0];
                questionMap[ans.questionId] = {
                    text: poolItem.text,
                    options: poolItem.options,
                    correctAnswerIndex: poolItem.correct,
                    explanation: poolItem.explanation
                };
                return;
              }

              try {
                const qDoc = await getDoc(doc(db, 'questions', ans.questionId));
                if (qDoc.exists()) {
                  questionMap[ans.questionId] = qDoc.data() as Question;
                } else {
                  questionMap[ans.questionId] = {
                    text: 'Question content not available',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswerIndex: 0,
                    explanation: 'Database record for this question was not found.'
                  };
                }
              } catch (e) {
                console.error(`Failed to fetch question ${ans.questionId}`, e);
                // Last ditch fallback
                questionMap[ans.questionId] = {
                    text: 'Error loading question detail',
                    options: ['N/A', 'N/A', 'N/A', 'N/A'],
                    correctAnswerIndex: 0,
                    explanation: 'There was an error communicating with the database.'
                };
              }
            });

            await Promise.all(fetchPromises);
          }

          if (!active) return;
          setAttempt(data);
          setQuestions(questionMap);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    getResults();
    return () => { active = false; };
  }, [attemptId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!attempt) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Session not found</h1>
      <Link href="/dashboard" className="mt-4 text-blue-600">Return Home</Link>
    </div>
  );

  const accuracy = Math.round((attempt.score / attempt.totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Session Analysis</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Review your performance and detailed breakdowns
            </p>
          </div>
          <div className="flex gap-4">
               <Link 
                href="/dashboard"
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/subjects"
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Try Another
              </Link>
          </div>
        </div>

        {/* Big Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-10 mb-8 border border-gray-100 shadow-xl shadow-gray-200 overflow-hidden relative"
        >
          <div className="relative z-10 grid md:grid-cols-3 gap-8 text-center items-center">
            <div className="space-y-2">
              <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Score Points</div>
              <div className="text-6xl font-black text-gray-900">{attempt.score}<span className="text-gray-200">/</span>{attempt.totalQuestions}</div>
            </div>
            
            <div className="relative flex justify-center">
               <div className="relative w-36 h-36 rounded-full border-8 border-gray-50 flex items-center justify-center overflow-hidden shadow-inner bg-white">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-blue-600 transition-all duration-1000 ease-out" 
                    style={{ height: `${accuracy}%` }} 
                  />
                  <div className="relative z-10 text-3xl font-black text-gray-900 drop-shadow-sm flex flex-col items-center">
                    <span className={accuracy > 50 ? 'text-white' : 'text-gray-900'}>{accuracy}%</span>
                    <span className={`text-[8px] uppercase tracking-widest font-black ${accuracy > 50 ? 'text-blue-100' : 'text-gray-400'}`}>Accuracy</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Taken</div>
                 <div className="text-lg font-bold text-gray-900">{formatTime(attempt.timeTaken)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl flex flex-col justify-center items-center">
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subject</div>
                 <div className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-black text-blue-600 shadow-sm truncate max-w-full">
                    {attempt.subjectName.toUpperCase()}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        </motion.div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 mb-8 italic font-serif border-b-4 border-blue-600 w-fit pr-8 pb-2">Detailed Review</h2>
          {attempt.answers.map((ans, idx) => {
            const q = questions[ans.questionId];
            const isCorrect = ans.isCorrect;

            if (!q) {
                return (
                    <div key={ans.questionId} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="animate-pulse w-10 h-10 bg-gray-100 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                            <div className="h-3 bg-gray-100 rounded w-1/4" />
                        </div>
                    </div>
                );
            }

            return (
              <motion.div 
                key={ans.questionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-start gap-6 mb-10">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      isCorrect ? 'bg-green-500 text-white shadow-green-100' : 'bg-red-500 text-white shadow-red-100'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Question {idx + 1}
                          </div>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                       </div>
                      <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {q.text}
                      </h3>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 space-y-4">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Selectable Options</div>
                      {q.options.map((opt, i) => {
                        const isSelected = ans.selectedIndex === i;
                        const isCorrectOpt = q.correctAnswerIndex === i;
                        
                        let colorClass = 'bg-white text-gray-500 border-gray-100';
                        if (isSelected && isCorrectOpt) colorClass = 'bg-green-300 text-green-950 border-green-400 shadow-md';
                        else if (isSelected && !isCorrectOpt) colorClass = 'bg-red-300 text-red-950 border-red-400 shadow-md';
                        else if (isCorrectOpt) colorClass = 'bg-green-100 text-green-800 border-green-200';

                        return (
                          <div key={i} className={`p-6 rounded-2xl border-2 font-bold text-lg flex items-center justify-between transition-all duration-300 ${colorClass}`}>
                            <div className="flex items-center gap-4">
                              <span className="opacity-30 font-black text-sm">{String.fromCharCode(65 + i)}.</span>
                              {opt}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {isCorrectOpt && (
                                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg shadow-green-200">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                              )}
                              {isSelected && !isCorrectOpt && (
                                  <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                                    <XCircle className="h-4 w-4 text-white" />
                                  </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 backdrop-blur-sm">
                         <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase tracking-widest text-[10px]">
                            <Info className="h-4 w-4" />
                            Why this answer?
                         </div>
                         <p className="text-gray-700 leading-relaxed font-semibold italic text-sm">
                            {q.explanation}
                         </p>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-white shadow-2xl">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Quick Recap</div>
                          <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                  <span className="text-xs text-slate-400 font-bold">Actual Ans:</span>
                                  <span className="font-black text-green-400 uppercase">{String.fromCharCode(65 + q.correctAnswerIndex)}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs text-slate-400 font-bold">Your Choice:</span>
                                  <span className={`font-black uppercase ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {ans.selectedIndex === -1 ? 'None' : String.fromCharCode(65 + ans.selectedIndex)}
                                  </span>
                              </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
