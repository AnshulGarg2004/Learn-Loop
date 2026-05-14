'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type QuestionStatus = 'open' | 'matched' | 'ongoing' | 'completed';
type UrgencyLevel = 'low' | 'medium' | 'high';

interface DashboardProfile {
  name: string;
  email: string;
  role: string;
  institution: string;
  preferredLanguage: string;
  knowledgeCredits: number;
  reputationPoints: number;
  teachingStreak: number;
  expertise: Array<{
    subject: string;
    topic?: string;
    proficiencyLevel: string;
    experiencePoints: number;
    averageRating: number;
    totalSessions: number;
  }>;
}

interface DashboardMetrics {
  credits: number;
  reputation: number;
  sessionsCompleted: number;
  requestsPosted: number;
  answeredQuestions: number;
  activeSessions: number;
}

interface PostedQuestion {
  _id: string;
  title: string;
  subject: string;
  topic?: string;
  status: QuestionStatus;
  urgencyLevel: UrgencyLevel;
  createdAt: string;
  replies: number;
  creditsOffered: number;
}

interface AnsweredQuestion {
  _id: string;
  title: string;
  subject: string;
  status: string;
  credits: number;
  date: string;
}

interface DashboardSession {
  _id: string;
  title: string;
  peer: string;
  time?: string;
  feedback?: string;
}

interface DashboardBadge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface DashboardTransaction {
  _id: string;
  type: 'earned' | 'spent';
  amount: string;
  reason: string;
  date: string;
}

interface DashboardResponse {
  profile: DashboardProfile;
  metrics: DashboardMetrics;
  postedQuestions: PostedQuestion[];
  answeredQuestions: AnsweredQuestion[];
  sessions: {
    ongoing: DashboardSession[];
    scheduled: DashboardSession[];
    completed: DashboardSession[];
  };
  badges: DashboardBadge[];
  transactions: DashboardTransaction[];
}

const sidebarOptions = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'find-tutoring', label: 'Find Tutoring', icon: '🎯' },
  { id: 'posted-questions', label: 'Posted Questions', icon: '❓' },
  { id: 'answered-questions', label: 'Answered Questions', icon: '✅' },
  { id: 'active-sessions', label: 'Active Sessions', icon: '🎥' },
  { id: 'credits', label: 'Credits & Wallet', icon: '💎' },
  { id: 'badges', label: 'Badges', icon: '🏆' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [acceptingQuestion, setAcceptingQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/dashboard', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load dashboard');
        }

        const data = (await response.json()) as DashboardResponse;
        setDashboardData(data);
      } catch (loadError: any) {
        console.error('Dashboard load error:', loadError);
        setError(loadError.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isLoaded, userId, router]);

  // Fetch available questions when tab changes to find-tutoring
  useEffect(() => {
    if (activeTab === 'find-tutoring') {
      const fetchAvailableQuestions = async () => {
        try {
          const response = await fetch('/api/available-questions', {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            setAvailableQuestions(data.questions);
          }
        } catch (err) {
          console.error('Failed to fetch available questions:', err);
        }
      };
      fetchAvailableQuestions();
    }
  }, [activeTab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  const handleAcceptQuestion = async (questionId: string) => {
    try {
      setAcceptingQuestion(questionId);
      const response = await fetch('/api/tutor/accept-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpRequestId: questionId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to accept question');
      }

      const data = await response.json();
      // Redirect to session page
      router.push(`/session/${data.session._id}`);
    } catch (err: any) {
      console.error('Error accepting question:', err);
      alert(err.message || 'Failed to accept question');
      setAcceptingQuestion(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-rose-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-sky-200 rounded-2xl shadow-lg p-8 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Unable to load dashboard</p>
          <p className="text-sm text-gray-600 mb-6">{error || 'No dashboard data returned from the server.'}</p>
          <button
            onClick={() => router.refresh()}
            className="px-5 py-3 rounded-lg bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = dashboardData.profile;
  const metrics = dashboardData.metrics;
  const postedQuestions = dashboardData.postedQuestions;
  const answeredQuestions = dashboardData.answeredQuestions;
  const sessions = dashboardData.sessions;
  const badges = dashboardData.badges;
  const transactions = dashboardData.transactions;
  const currentTitle = sidebarOptions.find((option) => option.id === activeTab)?.label ?? 'Dashboard';
  const initials =
    profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'LL';

  const statsCards = [
    { label: 'Knowledge Credits', value: metrics.credits, icon: '💎', color: 'bg-sky-100 border-sky-200' },
    { label: 'Reputation', value: metrics.reputation, icon: '⭐', color: 'bg-amber-100 border-amber-200' },
    { label: 'Sessions Completed', value: metrics.sessionsCompleted, icon: '🎯', color: 'bg-emerald-100 border-emerald-200' },
    { label: 'Posted Questions', value: metrics.requestsPosted, icon: '📝', color: 'bg-rose-100 border-rose-200' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-rose-50 flex">
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={`fixed lg:relative top-0 left-0 h-screen w-72 bg-linear-to-b from-white via-sky-50 to-fuchsia-50 border-r border-sky-200 shadow-lg z-40 transition-all duration-300 ${
          sidebarOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
            LearnLoop
          </h1>
          <p className="text-xs text-gray-500 mt-1">Learn. Teach. Grow.</p>
        </div>

        <div className="mx-4 p-4 bg-linear-to-br from-sky-50 via-white to-fuchsia-50 rounded-xl border border-sky-200 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{profile.name}</p>
              <p className="text-xs text-gray-600 capitalize">{profile.role}</p>
            </div>
          </div>
          <div className="text-xs text-gray-600 border-t border-sky-200 pt-3 mt-3 space-y-2">
            <div className="flex justify-between gap-3">
              <span>Credits</span>
              <span className="font-bold text-sky-700">{profile.knowledgeCredits}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Language</span>
              <span className="font-bold text-fuchsia-700">{profile.preferredLanguage || 'English'}</span>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4">
          {sidebarOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ x: 5 }}
              onClick={() => {
                setActiveTab(option.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === option.id
                  ? 'bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-sky-100'
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <span>{option.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button className="w-full px-4 py-3 border-2 border-sky-200 text-gray-700 rounded-lg font-semibold hover:bg-sky-100 transition-all">
            Logout
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 overflow-auto">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-sky-200 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen((value) => !value)}
                className="lg:hidden p-2 hover:bg-sky-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{currentTitle}</h2>
                <p className="text-sm text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/ask-for-help')}
              className="px-6 py-2 bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Ask for Help +
            </button>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statsCards.map((stat) => (
                    <motion.div key={stat.label} variants={itemVariants} className={`p-6 rounded-xl border-2 ${stat.color}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <span className="text-3xl">{stat.icon}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>❓</span> Recent Posted Questions
                      </h3>
                      <span className="text-sm text-gray-500">{postedQuestions.length} total</span>
                    </div>
                    <div className="space-y-3">
                      {postedQuestions.length > 0 ? (
                        postedQuestions.slice(0, 3).map((question) => (
                          <motion.div key={question._id} variants={itemVariants} className="p-4 bg-sky-50 rounded-lg border border-sky-200 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{question.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{question.subject}{question.topic ? ` • ${question.topic}` : ''}</p>
                                <p className="text-xs text-gray-500 mt-2">{question.createdAt}</p>
                              </div>
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${question.status === 'open' ? 'bg-sky-100 text-sky-700' : question.status === 'matched' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {question.status}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-6 text-sm text-gray-600">
                          No posted questions yet. Ask your first question to start learning.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">📊 Quick Stats</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                          <span className="text-gray-600">Answered Questions</span>
                          <span className="font-bold text-fuchsia-600">{metrics.answeredQuestions}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                          <span className="text-gray-600">Active Sessions</span>
                          <span className="font-bold text-emerald-600">{metrics.activeSessions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Teaching Streak</span>
                          <span className="font-bold text-amber-600">{profile.teachingStreak} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">🏆 Top Badges</h3>
                      <div className="space-y-2">
                        {badges.filter((badge) => badge.earned).slice(0, 3).length > 0 ? (
                          badges
                            .filter((badge) => badge.earned)
                            .slice(0, 3)
                            .map((badge) => (
                              <div key={badge._id} className="flex items-center gap-2 text-sm text-gray-700">
                                <span>{badge.icon}</span>
                                <span>{badge.name}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500">No badges earned yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'find-tutoring' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">🎯 Available Tutoring Opportunities</h3>
                  <div className="space-y-4">
                    {availableQuestions.length > 0 ? (
                      availableQuestions.map((question) => (
                        <motion.div
                          key={question._id}
                          variants={itemVariants}
                          className="p-4 bg-amber-50 rounded-lg border border-amber-200 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{question.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                              <div className="flex flex-wrap gap-3 mt-3">
                                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">{question.subject}</span>
                                {question.topic && (
                                  <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded">{question.topic}</span>
                                )}
                                <span
                                  className={`text-xs px-2 py-1 rounded font-semibold ${
                                    question.urgencyLevel === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : question.urgencyLevel === 'medium'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {question.urgencyLevel} urgency
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-amber-200 pt-4">
                              <div className="space-y-1 text-sm">
                                <p className="text-gray-600">
                                  <span className="font-semibold">{question.student.name}</span> is looking for help
                                </p>
                                <div className="flex gap-4 text-xs text-gray-500">
                                  <span>📅 {question.createdAt}</span>
                                  <span>👥 {question.applicationsCount} applicants</span>
                                  <span className="text-amber-600 font-semibold">+{question.creditsOffered} credits</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAcceptQuestion(question._id)}
                                disabled={acceptingQuestion === question._id}
                                className="px-4 py-2 bg-linear-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                              >
                                {acceptingQuestion === question._id ? '⏳ Accepting...' : '✓ Accept & Start'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-gray-600">
                        No available questions at the moment. Check back later!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'posted-questions' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Your Posted Questions</h3>
                  <div className="space-y-4">
                    {postedQuestions.length > 0 ? (
                      postedQuestions.map((question) => (
                        <motion.div key={question._id} variants={itemVariants} className="p-4 bg-rose-50 rounded-lg border border-rose-200 hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{question.title}</h4>
                              <div className="flex flex-wrap gap-3 mt-2">
                                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">{question.subject}</span>
                                {question.topic && <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded">{question.topic}</span>}
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${question.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' : question.urgencyLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {question.urgencyLevel} urgency
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span>💬 {question.replies} replies</span>
                              <span className="text-xs text-gray-500">{question.createdAt}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-6 text-sm text-gray-600">
                        No posted questions found.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'answered-questions' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Questions You've Answered</h3>
                  <div className="space-y-4">
                    {answeredQuestions.length > 0 ? (
                      answeredQuestions.map((question) => (
                        <motion.div key={question._id} variants={itemVariants} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{question.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{question.subject}</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <p className="font-bold text-emerald-600">+{question.credits} credits</p>
                                <p className="text-xs text-gray-600 capitalize">{question.status}</p>
                              </div>
                              <span className="text-xs text-gray-500">{question.date}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm text-gray-600">
                        No answered questions yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'active-sessions' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🎓 Ongoing Sessions</h3>
                    <div className="space-y-4">
                      {sessions.ongoing.length > 0 ? (
                        sessions.ongoing.map((session) => (
                          <motion.div key={session._id} variants={itemVariants} className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                            <p className="font-semibold text-gray-900">{session.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{session.peer}</p>
                            <p className="text-xs font-semibold text-sky-600 mt-2">⏱️ {session.time || 'In progress'}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-6 text-sm text-gray-600">
                          No ongoing sessions right now.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Scheduled Sessions</h3>
                    <div className="space-y-4">
                      {sessions.scheduled.length > 0 ? (
                        sessions.scheduled.map((session) => (
                          <motion.div key={session._id} variants={itemVariants} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="font-semibold text-gray-900">{session.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{session.peer}</p>
                            <p className="text-xs font-semibold text-amber-700 mt-2">📅 {session.time || 'Scheduled'}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-gray-600">
                          No scheduled sessions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">✅ Completed Sessions</h3>
                  <div className="space-y-3">
                    {sessions.completed.length > 0 ? (
                      sessions.completed.map((session) => (
                        <motion.div key={session._id} variants={itemVariants} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{session.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{session.peer}</p>
                            <p className="text-xs text-emerald-700 mt-2">📝 {session.feedback || 'Completed'}</p>
                          </div>
                          <button 
                            onClick={() => router.push(`/quiz/${session._id}`)}
                            className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            Take AI Quiz ✍️
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm text-gray-600">
                        No completed sessions yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'credits' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-linear-to-br from-sky-600 via-fuchsia-600 to-rose-500 text-white p-8 rounded-xl shadow-lg">
                    <p className="text-sm opacity-90">Total Credits</p>
                    <p className="text-4xl font-bold mt-2">{profile.knowledgeCredits}</p>
                  </div>
                  <div className="bg-white p-8 rounded-xl border border-sky-200 shadow-sm">
                    <p className="text-sm text-gray-600">Credits Earned</p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">
                      {transactions
                        .filter((transaction) => transaction.type === 'earned')
                        .reduce((sum, transaction) => sum + Number(transaction.amount.replace('+', '')), 0)}
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-xl border border-rose-200 shadow-sm">
                    <p className="text-sm text-gray-600">Credits Spent</p>
                    <p className="text-4xl font-bold text-rose-600 mt-2">
                      {transactions
                        .filter((transaction) => transaction.type === 'spent')
                        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Transaction History</h3>
                  <div className="space-y-2">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <motion.div key={transaction._id} variants={itemVariants} className="flex justify-between items-center p-4 bg-sky-50 rounded-lg border border-sky-200">
                          <div>
                            <p className="font-semibold text-gray-900">{transaction.reason}</p>
                            <p className="text-xs text-gray-600 mt-1">{transaction.date}</p>
                          </div>
                          <span className={`font-bold text-lg ${transaction.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {transaction.amount}
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-6 text-sm text-gray-600">
                        No credit transactions yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'badges' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">🏆 Your Badges & Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.length > 0 ? (
                      badges.map((badge) => (
                        <motion.div
                          key={badge._id}
                          variants={itemVariants}
                          className={`p-4 text-center rounded-lg border-2 transition-all ${
                            badge.earned ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-300 opacity-50'
                          }`}
                        >
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                          <p className="text-xs text-gray-600 mt-2">{badge.description}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-gray-600">
                        No badges available yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div className="bg-white p-8 rounded-xl border border-sky-200 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-sky-200">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">👤 My Profile</h3>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                          {initials}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{profile.role}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900">{profile.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Institution</p>
                          <p className="font-semibold text-gray-900">{profile.institution || 'Not added yet'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Preferred Language</p>
                          <p className="font-semibold text-gray-900">{profile.preferredLanguage || 'English'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Expertise Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.expertise.length > 0 ? (
                              profile.expertise.map((entry, index) => (
                                <span key={`${entry.subject}-${entry.topic}-${index}`} className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm font-medium">
                                  {entry.topic ? `${entry.subject} • ${entry.topic}` : entry.subject}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No expertise added yet.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl font-bold text-gray-900">📊 Stats</h3>
                      {[
                        { label: 'Knowledge Credits', value: profile.knowledgeCredits, icon: '💎' },
                        { label: 'Reputation Points', value: profile.reputationPoints, icon: '⭐' },
                        { label: 'Teaching Streak', value: `${profile.teachingStreak} days`, icon: '🔥' },
                        { label: 'Sessions Completed', value: metrics.sessionsCompleted, icon: '⏱️' },
                      ].map((stat) => (
                        <motion.div key={stat.label} variants={itemVariants} className="flex justify-between p-3 bg-sky-50 rounded-lg border border-sky-200">
                          <span className="text-gray-600">{stat.label}</span>
                          <span className="font-bold">{stat.icon} {stat.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full md:w-auto px-8 py-3 bg-linear-to-r from-sky-600 via-fuchsia-600 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                    Edit Profile
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
