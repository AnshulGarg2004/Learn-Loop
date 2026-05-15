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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 font-medium">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="text-center p-6 bg-white border border-zinc-200 rounded-lg max-w-sm w-full">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Generation Failed</h2>
          <p className="text-sm text-zinc-500 mb-6">We couldn't generate a quiz for this session. Please try again later.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-zinc-500">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              {Math.round(((currentQuestionIndex + 1) / quizData.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-zinc-900"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-lg shadow-sm p-6 border border-zinc-200"
            >
              <h2 className="text-lg font-semibold text-zinc-900 mb-6 tracking-tight">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full px-4 py-3 rounded-md text-left border text-sm font-medium transition-colors ${
                      selectedAnswer === idx
                        ? idx === currentQuestion.correctAnswer
                          ? 'border-zinc-900 bg-zinc-50 text-zinc-900'
                          : 'border-red-300 bg-red-50 text-red-900'
                        : selectedAnswer !== null && idx === currentQuestion.correctAnswer
                          ? 'border-green-300 bg-green-50 text-green-900'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option}</span>
                      {selectedAnswer !== null && idx === currentQuestion.correctAnswer && (
                        <span className="text-green-600">✓</span>
                      )}
                      {selectedAnswer === idx && idx !== currentQuestion.correctAnswer && (
                        <span className="text-red-600">✕</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 p-4 bg-zinc-50 rounded-md border border-zinc-200"
                >
                  <p className="text-sm font-semibold text-zinc-900 mb-1">Explanation</p>
                  <p className="text-sm text-zinc-600">{currentQuestion.explanation}</p>
                  
                  <button
                    onClick={handleNext}
                    className="w-full mt-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    {currentQuestionIndex === quizData.questions.length - 1 ? 'See Results' : 'Next Question'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-lg shadow-sm p-8 text-center border border-zinc-200"
            >
              <h2 className="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">Quiz Completed</h2>
              <p className="text-sm text-zinc-500 mb-8">You've mastered the session topic.</p>
              
              <div className="flex justify-center gap-12 mb-8 border-y border-zinc-100 py-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Score</p>
                  <p className="text-3xl font-semibold text-zinc-900">{score}/{quizData.questions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Accuracy</p>
                  <p className="text-3xl font-semibold text-zinc-900">{Math.round((score / quizData.questions.length) * 100)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="py-2 border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
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
