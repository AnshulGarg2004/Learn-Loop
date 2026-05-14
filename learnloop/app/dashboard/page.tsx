'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';

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
  sessionId?: string;
}

interface AnsweredQuestion {
  _id: string;
  title: string;
  subject: string;
  status: string;
  credits: number;
  date: string;
  sessionId?: string;
}

interface AvailableQuestion {
  _id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  student: { name: string };
  urgencyLevel: UrgencyLevel;
  creditsOffered: number;
  createdAt: string;
  applicationsCount: number;
  matchScore?: number;
  matchReason?: string;
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
  { id: 'leaderboard', label: 'Leaderboard', icon: '🥇' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const { isConnected, registerUser, onRequestAccepted, tutorAccepted } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<AvailableQuestion[]>([]);
  const [acceptingQuestion, setAcceptingQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expertise Management State
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState('');
  const [isUpdatingExpertise, setIsUpdatingExpertise] = useState(false);

  useEffect(() => {
    if (showExpertiseModal) {
      const fetchSubjects = async () => {
        try {
          const res = await fetch('/api/subjects');
          if (res.ok) {
            const data = await res.json();
            setAllSubjects(data.subjects);
          }
        } catch (err) {
          console.error('Failed to fetch subjects:', err);
        }
      };
      fetchSubjects();
    }
  }, [showExpertiseModal]);

  useEffect(() => {
    if (selectedSubjectId) {
      const fetchTopics = async () => {
        try {
          const res = await fetch(`/api/subjects?subjectId=${selectedSubjectId}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableTopics(data.topics);
          }
        } catch (err) {
          console.error('Failed to fetch topics:', err);
        }
      };
      fetchTopics();
    } else {
      setAvailableTopics([]);
    }
  }, [selectedSubjectId]);

  const handleUpdateExpertise = async () => {
    if (!selectedSubjectId) return;

    setIsUpdatingExpertise(true);
    try {
      const subjectObj = allSubjects.find(s => s._id === selectedSubjectId);
      const newExpertise = {
        subject: subjectObj?.name,
        topic: selectedTopicName,
        proficiencyLevel: 'intermediate'
      };

      // Add to existing expertise
      const currentExpertise = dashboardData?.profile.expertise || [];
      const updatedList = [...currentExpertise, newExpertise];

      const res = await fetch('/api/user/expertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertise: updatedList })
      });

      if (res.ok) {
        // Refresh dashboard data
        const refreshRes = await fetch('/api/dashboard');
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setDashboardData(data);
        }
        setShowExpertiseModal(false);
        setSelectedSubjectId('');
        setSelectedTopicName('');
      }
    } catch (err) {
      console.error('Failed to update expertise:', err);
    } finally {
      setIsUpdatingExpertise(false);
    }
  };

  const handleRemoveExpertise = async (index: number) => {
    const currentExpertise = [...(dashboardData?.profile.expertise || [])];
    currentExpertise.splice(index, 1);

    try {
      const res = await fetch('/api/user/expertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertise: currentExpertise })
      });

      if (res.ok) {
        const refreshRes = await fetch('/api/dashboard');
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setDashboardData(data);
        }
      }
    } catch (err) {
      console.error('Failed to remove expertise:', err);
    }
  };

  // Register for notifications
  useEffect(() => {
    if (isConnected && user?.id) {
      registerUser(user.id);
    }
  }, [isConnected, user?.id, registerUser]);

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

      // Notify the student
      if (isConnected && data.session?.student?.clerkId) {
        tutorAccepted(data.session.student.clerkId, data.session._id, user?.firstName || 'A tutor');
      }

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

    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className={`fixed lg:relative top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 shadow-sm z-50 transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="mb-10">
            <h1 className="text-2xl font-black tracking-tight text-indigo-600">
              LEARN<span className="text-slate-900">LOOP</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Peer Learning Ecosystem</p>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {sidebarOptions.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (option.id === 'leaderboard') {
                    router.push('/leaderboard');
                  } else {
                    setActiveTab(option.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === option.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span className="text-xl opacity-90">{option.icon}</span>
                <span className="text-sm">{option.label}</span>
              </motion.button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button className="w-full px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-40 sticky top-0"
        >
          <div className="flex items-center gap-6 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-all"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentTitle}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Ecosystem</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <span className="text-lg">💎</span>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Credits</p>
                <p className="text-sm font-black text-indigo-700">{profile.knowledgeCredits}</p>
              </div>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-100 ring-4 ring-white">
              {initials}
            </div>

            <button
              onClick={() => router.push('/ask-for-help')}
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-95"
            >
              <span>+</span> Ask Help
            </button>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">

            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                      <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                          </div>
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
                            {stat.icon}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Questions */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                      </div>

                      <div className="space-y-4">
                        {postedQuestions.length > 0 ? (
                          postedQuestions.slice(0, 4).map((question) => (
                            <motion.div
                              key={question._id}
                              variants={itemVariants}
                              onClick={() => question.sessionId && router.push(`/session/${question.sessionId}`)}
                              className={`group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all ${question.sessionId ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{question.title}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">{question.subject}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">{question.createdAt}</span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${question.status === 'open'
                                  ? 'bg-indigo-50 text-indigo-600'
                                  : question.status === 'matched'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                  {question.status}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <p className="text-slate-400 font-medium">No activity yet. Start by asking a question!</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-8">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Ecosystem Status</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Teaching Streak</span>
                            <span className="text-sm font-black text-amber-500">🔥 {profile.teachingStreak} Days</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Expertise Level</span>
                            <span className="text-sm font-black text-indigo-600">Expert</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Global Rank</span>
                            <span className="text-sm font-black text-slate-900">#42</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-4xl opacity-20 group-hover:scale-110 transition-transform">🏆</div>
                        <h3 className="text-sm font-bold text-indigo-100 mb-4 uppercase tracking-wider">Top Badges</h3>
                        <div className="flex flex-wrap gap-2">
                          {badges.filter(b => b.earned).slice(0, 4).length > 0 ? (
                            badges.filter(b => b.earned).slice(0, 4).map(badge => (
                              <div key={badge._id} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl hover:bg-white/20 transition-colors" title={badge.name}>
                                {badge.icon}
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] font-bold text-indigo-200">Start teaching to earn badges!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'find-tutoring' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                  {profile.expertise && profile.expertise.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-8 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform rotate-12">✨</div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-2xl">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🤖</span>
                            <h3 className="text-xl font-bold tracking-tight">AI Smart Matching Active</h3>
                          </div>
                          <p className="text-indigo-100 leading-relaxed font-medium">
                            We've highlighted tutoring requests that match your expertise in <span className="text-white font-black">{profile.expertise.map(e => e.subject).join(', ')}</span>.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowExpertiseModal(true)}
                          className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-all whitespace-nowrap"
                        >
                          Refine Profile
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Open Bounties</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Sort by:</span>
                        <select className="bg-transparent text-xs font-black text-slate-900 border-none focus:ring-0 cursor-pointer">
                          <option>Newest</option>
                          <option>High Credits</option>
                          <option>Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {availableQuestions.length > 0 ? (
                        availableQuestions.map((question) => (
                          <motion.div
                            key={question._id}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                            className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${question.urgencyLevel === 'high'
                                  ? 'bg-rose-50 text-rose-600'
                                  : question.urgencyLevel === 'medium'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                  {question.urgencyLevel} Priority
                                </span>
                                {question && question.matchScore && question.matchScore > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-linear-to-r from-indigo-500 to-violet-600 text-white rounded-lg shadow-sm"
                                  >
                                    <span className="text-[9px] font-black uppercase tracking-wider">✨ {question.matchScore}% Match</span>
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                <span className="text-sm">💎</span>
                                <span className="text-sm font-black text-indigo-700">{question.creditsOffered}</span>
                              </div>
                            </div>

                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
                                {question.title}
                              </h4>
                              {question.matchReason && (
                                <p className="text-[11px] font-medium text-slate-500 bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100 italic">
                                  " {question.matchReason} "
                                </p>
                              )}
                              <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                                {question.description}
                              </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {question.student.name?.[0] || 'S'}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-900 truncate max-w-[100px]">{question.student.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{question.subject}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Applicants</p>
                                  <p className="text-[11px] font-black text-slate-900">{question.applicationsCount || 0}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAcceptQuestion(question._id)}
                                disabled={acceptingQuestion === question._id}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all disabled:opacity-50 active:scale-[0.98]"
                              >
                                {acceptingQuestion === question._id ? 'Joining Session...' : 'Accept Bounty'}
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                          <span className="text-4xl mb-4 block">🔍</span>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Open Bounties Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'posted-questions' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Your Posted Questions</h3>
                    <button onClick={() => router.push('/ask-for-help')} className="text-sm font-bold text-indigo-600">+ New Request</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {postedQuestions.length > 0 ? (
                      postedQuestions.map((question) => (
                        <motion.div key={question._id} variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${question.status === 'open' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                              {question.status}
                            </span>
                            <span className="text-sm font-black text-slate-900">💎 {question.creditsOffered}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 mb-2">{question.title}</h4>
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{question.subject}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase">💬 {question.replies} Replies</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Questions Posted</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'answered-questions' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Teaching History</h3>
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credits Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {answeredQuestions.length > 0 ? (
                          answeredQuestions.map((question) => (
                            <tr key={question._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 text-sm">{question.title}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{question.subject}</td>
                              <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">+{question.credits}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">You haven't answered any questions yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'active-sessions' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">Live Now</h3>
                      {sessions.ongoing.length > 0 ? (
                        sessions.ongoing.map((session) => (
                          <motion.div key={session._id} variants={itemVariants} className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-lg shadow-indigo-50 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{session.title}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Peer: {session.peer}</p>
                            </div>
                            <button onClick={() => router.push(`/session/${session._id}`)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs">Join</button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Sessions</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">Scheduled</h3>
                      {sessions.scheduled.length > 0 ? (
                        sessions.scheduled.map((session) => (
                          <div key={session._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-900">{session.title}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Peer: {session.peer}</p>
                            </div>
                            <p className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{session.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Scheduled Sessions</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">History & Feedback</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessions.completed.map((session) => (
                        <div key={session._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="font-bold text-slate-900 text-sm truncate">{session.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{session.peer}</p>
                          <button
                            onClick={() => router.push(`/quiz/${session._id}`)}
                            className="w-full mt-4 py-2.5 bg-slate-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            Review Quiz ✍️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'credits' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Wallet Balance</p>
                      <p className="text-5xl font-black mt-2 tracking-tighter">💎 {profile.knowledgeCredits}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Earned</p>
                      <p className="text-4xl font-black mt-2 text-emerald-600 tracking-tighter">
                        +{transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + Number(t.amount.replace('+', '')), 0)}
                      </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Spent</p>
                      <p className="text-4xl font-black mt-2 text-rose-600 tracking-tighter">
                        -{transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Transaction Ledger</h3>
                      <button className="text-xs font-bold text-slate-400 hover:text-indigo-600">Download CSV</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {transactions.map((t) => (
                        <div key={t._id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{t.reason}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{t.date}</p>
                          </div>
                          <span className={`text-sm font-black ${t.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hall of Fame</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">{badges.filter(b => b.earned).length}/{badges.length} Unlocked</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {badges.map((badge) => (
                      <motion.div
                        key={badge._id}
                        variants={itemVariants}
                        whileHover={badge.earned ? { y: -5, scale: 1.05 } : {}}
                        className={`relative p-6 text-center rounded-[2rem] border-2 transition-all ${badge.earned
                          ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50 grayscale-0'
                          : 'bg-slate-50 border-slate-100 opacity-40 grayscale pointer-events-none'
                          }`}
                      >
                        <div className="text-5xl mb-4 drop-shadow-sm">{badge.icon}</div>
                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{badge.name}</p>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">{badge.description}</p>
                        </div>
                        {!badge.earned && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/10 backdrop-blur-[1px] rounded-[2rem]">
                            <span className="text-xl opacity-20">🔒</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-10 border-b border-slate-100">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100 ring-8 ring-indigo-50">
                          {initials}
                        </div>
                        <div className="text-center md:text-left flex-1 min-w-0">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{profile.name}</h3>
                          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">{profile.role}</p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">{profile.email}</span>
                            <span className="px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">{profile.institution || 'Individual Learner'}</span>
                          </div>
                        </div>
                        <button className="px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Edit Profile</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Expertise Stack</h4>
                            <button
                              onClick={() => setShowExpertiseModal(true)}
                              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                              + Manage
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.expertise.length > 0 ? (
                              profile.expertise.map((entry, index) => (
                                <div key={index} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-white transition-all cursor-default">
                                  <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                                  <span className="text-xs font-black text-slate-700">{entry.subject}</span>
                                  {entry.topic && <span className="text-[10px] font-bold text-slate-400">• {entry.topic}</span>}
                                  <button
                                    onClick={() => handleRemoveExpertise(index)}
                                    className="ml-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-400 italic">No expertise added yet.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Learning Metrics</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-500">Global Reputation</span>
                              <span className="text-sm font-black text-slate-900">{profile.reputationPoints} Points</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-500">Preferred Language</span>
                              <span className="text-sm font-black text-slate-900">{profile.preferredLanguage}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>


            {/* Expertise Management Modal */}
            <AnimatePresence>
              {showExpertiseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-white"
                  >
                    <div className="p-8 border-b border-slate-100 bg-linear-to-br from-indigo-600 to-violet-700 text-white">
                      <h3 className="text-2xl font-black tracking-tight">Add Expertise</h3>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Refine your teaching profile</p>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select a subject...</option>
                          {allSubjects.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <AnimatePresence mode="wait">
                        {selectedSubjectId && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topic (Optional)</label>
                            <select
                              value={selectedTopicName}
                              onChange={(e) => setSelectedTopicName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Any topic</option>
                              {availableTopics.map((t) => (
                                <option key={t._id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                      <button
                        onClick={() => setShowExpertiseModal(false)}
                        className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateExpertise}
                        disabled={!selectedSubjectId || isUpdatingExpertise}
                        className="flex-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95 disabled:opacity-30 shadow-lg"
                      >
                        {isUpdatingExpertise ? 'Adding...' : 'Add Subject'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
