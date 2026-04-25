'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Timer, 
  AlertCircle,
  Flag,
  ChevronRight
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  subjectId: string;
}

function QuizEngineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const subjectId = searchParams.get('subjectId');
  const topicId = searchParams.get('topicId');
  const difficulty = searchParams.get('difficulty');
  const count = parseInt(searchParams.get('count') || '10');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(count * 60); // 1 min per question
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function getQuestions() {
      if (!subjectId) return;
      try {
        let q = query(
          collection(db, 'questions'),
          where('subjectId', '==', subjectId),
          where('difficulty', '==', difficulty),
          where('status', '==', 'published'),
          limit(count)
        );

        if (topicId && topicId !== 'all') {
          q = query(q, where('topicId', '==', topicId));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
        
        if (!isMounted) return;

        const dbQuestions = data.sort(() => Math.random() - 0.5).slice(0, count);
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

        if (dbQuestions.length < count) {
            const needed = count - dbQuestions.length;
            const generatedMocks = Array.from({ length: needed }).map((_, i) => {
                const item = mockPool[(dbQuestions.length + i) % mockPool.length];
                return {
                    id: `mock-${dbQuestions.length + i}`,
                    text: item.text,
                    options: item.options,
                    correctAnswerIndex: item.correct,
                    explanation: item.explanation,
                    subjectId: subjectId || 'economics'
                };
            });
            setQuestions([...dbQuestions, ...generatedMocks]);
        } else {
            setQuestions(dbQuestions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    getQuestions();
    return () => { isMounted = false; };
  }, [subjectId, difficulty, count, topicId]);

  const submitQuiz = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let score = 0;
    const finalAnswers = questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctAnswerIndex;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        selectedIndex: selected !== undefined ? selected : -1,
        isCorrect
      };
    });

    const attemptData = {
      userId: user?.uid,
      subjectId,
      score,
      totalQuestions: questions.length,
      answers: finalAnswers,
      timeTaken: (count * 60) - timeLeft,
      startedAt: new Date(Date.now() - ((count * 60) - timeLeft) * 1000).toISOString(),
      completedAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'attempts'), attemptData);
      router.push(`/results/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, questions, answers, user?.uid, subjectId, count, timeLeft, router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      const autoSubmit = async () => {
        await submitQuiz();
      };
      autoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitQuiz]);

  const selectOption = (optionIndex: number) => {
    setAnswers({ ...answers, [currentIndex]: optionIndex });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Warming up your session...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-6" />
            <h1 className="text-2xl font-bold mb-2">No Questions Found</h1>
            <p className="text-gray-500 mb-8">Try a different difficulty or topic.</p>
            <button onClick={() => router.back()} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl">Go Back</button>
        </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <div className="fixed top-0 w-full h-2 z-50 bg-gray-200">
        <div 
          className="h-full bg-blue-600 transition-all duration-300" 
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20 flex-grow flex flex-col">
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center font-black text-blue-600">
              {currentIndex + 1}
            </div>
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Question</div>
              <div className="text-sm font-bold text-gray-900">of {questions.length}</div>
            </div>
          </div>

          <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 font-mono font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-gray-900 border-gray-200'}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          <button 
            onClick={submitQuiz}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Finish
          </button>
        </div>

        {/* Question Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[3rem] p-10 md:p-16 border border-gray-100 shadow-xl shadow-gray-200 flex-grow"
          >
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-12">
              {currentQuestion.text}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className={`w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center justify-between group ${
                    answers[currentIndex] === i 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md translate-x-2' 
                      : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      answers[currentIndex] === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 group-hover:text-blue-600'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={`text-lg font-bold ${answers[currentIndex] === i ? 'text-blue-900' : 'text-gray-600'}`}>
                      {option}
                    </span>
                  </div>
                  {answers[currentIndex] === i && (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-10 flex justify-between gap-4">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="flex-1 py-5 rounded-3xl bg-white border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          {currentIndex === questions.length - 1 ? (
             <button
                onClick={submitQuiz}
                disabled={isSubmitting || answers[currentIndex] === undefined}
                className="flex-[2] py-5 rounded-3xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Finalizing...' : 'Submit Session'}
                <CheckCircle2 className="h-5 w-5" />
              </button>
          ) : (
            <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={answers[currentIndex] === undefined}
                className="flex-[2] py-5 rounded-3xl bg-gray-900 text-white font-black hover:bg-blue-600 shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Continue
                <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizEngineContent />
        </Suspense>
    )
}
