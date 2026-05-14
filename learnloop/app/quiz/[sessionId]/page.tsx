'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizGenerator } from '@/lib/useGenAIHooks';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  const { generate: generateQuiz, loading: quizzing } = useQuizGenerator();

  useEffect(() => {
    const initQuiz = async () => {
      try {
        // Fetch session info to get the topic
        const res = await fetch(`/api/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionData(data.session);
          
          // Generate quiz based on topic
          const quiz = await generateQuiz(data.session.topic || "General Study", "medium", 5);
          setQuizData(quiz);
        }
      } catch (error) {
        console.error('Failed to initialize quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      initQuiz();
    }
  }, [sessionId]);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    
    if (index === quizData.questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  if (loading || quizzing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium italic">Generating your personalized AI quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Quiz Generation Failed</h2>
          <p className="text-slate-600 mb-6">We couldn't generate a quiz for this session. Please try again later.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </span>
            <span className="text-sm font-bold text-fuchsia-600">
              {Math.round(((currentQuestionIndex + 1) / quizData.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              className="h-full bg-linear-to-r from-sky-500 to-fuchsia-500"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-4">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                      selectedAnswer === idx
                        ? idx === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : selectedAnswer !== null && idx === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-100 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option}</span>
                      {selectedAnswer !== null && idx === currentQuestion.correctAnswer && (
                        <span>✅</span>
                      )}
                      {selectedAnswer === idx && idx !== currentQuestion.correctAnswer && (
                        <span>❌</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <p className="text-sm font-bold text-slate-800 mb-1">Explanation:</p>
                  <p className="text-sm text-slate-600">{currentQuestion.explanation}</p>
                  
                  <button
                    onClick={handleNext}
                    className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    {currentQuestionIndex === quizData.questions.length - 1 ? 'See Results' : 'Next Question'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100"
            >
              <div className="text-6xl mb-6">
                {score === quizData.questions.length ? '🏆' : score > quizData.questions.length / 2 ? '👏' : '📚'}
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Completed!</h2>
              <p className="text-slate-500 mb-8">You've mastered the session topic.</p>
              
              <div className="flex justify-center gap-12 mb-12">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Score</p>
                  <p className="text-4xl font-black text-fuchsia-600">{score}/{quizData.questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Accuracy</p>
                  <p className="text-4xl font-black text-sky-600">{Math.round((score / quizData.questions.length) * 100)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="py-4 bg-linear-to-r from-sky-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
