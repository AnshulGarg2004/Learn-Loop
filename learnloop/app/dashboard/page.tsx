'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import Link from 'next/link';

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
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

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
    <div className="min-h-screen bg-purple-50/50 flex text-gray-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-white shadow-2xl lg:shadow-none border-r border-purple-100 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900 hover:text-purple-600 transition-colors inline-block">
                LEARNLOOP
              </Link>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500 mt-1">Enterprise Learning</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-2 text-gray-500 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {sidebarOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === 'leaderboard') {
                    router.push('/leaderboard');
                  } else {
                    setActiveTab(option.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-sm transition-colors duration-150 ${activeTab === option.id
                  ? 'bg-white text-gray-900 border border-purple-100 shadow-lg shadow-purple-500/10'
                  : 'text-gray-500 hover:bg-purple-100 hover:text-gray-900 border border-transparent'
                  }`}
              >
                <span className="text-lg opacity-80">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-4 mt-4 border-t border-purple-100">
            {/* User settings or help could go here */}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-white w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-purple-100 flex items-center justify-between px-6 z-40 sticky top-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-2 bg-purple-50/50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{currentTitle}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Live Connection</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-50/50 border border-purple-100 rounded-xl">
              <span className="text-sm">💎</span>
              <div className="leading-tight">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Credits</p>
                <p className="text-xs font-semibold text-gray-900">{profile.knowledgeCredits}</p>
              </div>
            </div>

            <UserButton />

            <button
              onClick={() => router.push('/ask-for-help')}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg shadow-purple-500/20"
            >
              <span>+</span> Ask Help
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">

            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((stat) => (
                      <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        className="bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 transition-colors hover:bg-purple-50/50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{stat.label}</p>
                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                          </div>
                          <div className="w-8 h-8 bg-purple-50/50 border border-zinc-100 rounded-xl flex items-center justify-center text-base shadow-md shadow-purple-500/5">
                            {stat.icon}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Questions */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Recent Activity</h3>
                        <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">View All</button>
                      </div>

                      <div className="space-y-3">
                        {postedQuestions.length > 0 ? (
                          postedQuestions.slice(0, 4).map((question) => (
                            <motion.div
                              key={question._id}
                              variants={itemVariants}
                              onClick={() => question.sessionId && router.push(`/session/${question.sessionId}`)}
                              className={`group bg-white p-4 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors ${question.sessionId ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 truncate">{question.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-medium text-gray-500 uppercase">{question.subject}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                    <span className="text-[10px] font-medium text-gray-500 uppercase">{question.createdAt}</span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${question.status === 'open'
                                  ? 'bg-purple-50/50 text-gray-700 border-purple-100'
                                  : question.status === 'matched'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                  {question.status}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="bg-purple-50/50 rounded-xl border border-dashed border-purple-200 p-8 text-center">
                            <p className="text-sm text-gray-500 font-medium">No activity yet. Start by asking a question.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                      <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10">
                        <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wider">Ecosystem Status</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                            <span className="text-xs font-medium text-gray-500 uppercase">Teaching Streak</span>
                            <span className="text-xs font-semibold text-gray-900">{profile.teachingStreak} Days</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                            <span className="text-xs font-medium text-gray-500 uppercase">Expertise Level</span>
                            <span className="text-xs font-semibold text-gray-900">Expert</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500 uppercase">Global Rank</span>
                            <span className="text-xs font-semibold text-gray-900">#42</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-xl shadow-lg shadow-purple-500/10 border border-indigo-500/30 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 text-4xl opacity-10">🏆</div>
                        <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider relative z-10">Top Badges</h3>
                        <div className="flex flex-wrap gap-2 relative z-10">
                          {badges.filter(b => b.earned).slice(0, 4).length > 0 ? (
                            badges.filter(b => b.earned).slice(0, 4).map(badge => (
                              <div key={badge._id} className="w-8 h-8 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-sm hover:bg-white/20 transition-colors" title={badge.name}>
                                {badge.icon}
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] font-medium text-gray-500">Start teaching to earn badges</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'find-tutoring' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  {profile.expertise && profile.expertise.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white border border-indigo-500/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 text-6xl opacity-5 rotate-12">✨</div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-2xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🤖</span>
                            <h3 className="text-base font-semibold tracking-tight">AI Smart Matching Active</h3>
                          </div>
                          <p className="text-sm text-gray-400 font-medium">
                            We've highlighted tutoring requests that match your expertise in <span className="text-white">{profile.expertise.map(e => e.subject).join(', ')}</span>.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowExpertiseModal(true)}
                          className="px-4 py-2 bg-white text-gray-900 rounded-xl font-medium text-sm hover:bg-purple-100 transition-colors whitespace-nowrap"
                        >
                          Refine Profile
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 tracking-tight">Open Bounties</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Sort by:</span>
                        <select className="bg-transparent text-xs font-semibold text-gray-900 border-none focus:ring-0 cursor-pointer">
                          <option>Newest</option>
                          <option>High Credits</option>
                          <option>Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {availableQuestions.length > 0 ? (
                        availableQuestions.map((question) => (
                          <motion.div
                            key={question._id}
                            variants={itemVariants}
                            className="group bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 hover:border-purple-200 transition-all flex flex-col"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col gap-2">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${question.urgencyLevel === 'high'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : question.urgencyLevel === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                  {question.urgencyLevel} Priority
                                </span>
                                {question && question.matchScore && question.matchScore > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg shadow-purple-500/10"
                                  >
                                    <span className="text-[9px] font-semibold uppercase tracking-wider">✨ {question.matchScore}% Match</span>
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 bg-purple-50/50 border border-purple-100 px-2 py-1 rounded-xl">
                                <span className="text-xs">💎</span>
                                <span className="text-xs font-semibold text-gray-900">{question.creditsOffered}</span>
                              </div>
                            </div>

                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors leading-tight mb-2">
                                {question.title}
                              </h4>
                              {question.matchReason && (
                                <p className="text-[10px] font-medium text-gray-500 bg-purple-50/50 p-2.5 rounded-xl mb-3 border border-purple-100 italic">
                                  " {question.matchReason} "
                                </p>
                              )}
                              <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                                {question.description}
                              </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {question.student.name?.[0] || 'S'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[100px]">{question.student.name}</p>
                                    <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">{question.subject}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">Applicants</p>
                                  <p className="text-xs font-semibold text-gray-900">{question.applicationsCount || 0}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAcceptQuestion(question._id)}
                                disabled={acceptingQuestion === question._id}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
                              >
                                {acceptingQuestion === question._id ? 'Joining Session...' : 'Accept Bounty'}
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full bg-purple-50/50 rounded-xl border border-dashed border-purple-200 p-12 text-center">
                          <span className="text-2xl mb-2 block">🔍</span>
                          <p className="text-gray-500 font-medium text-sm">No Open Bounties Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'posted-questions' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Your Posted Questions</h3>
                    <button onClick={() => router.push('/ask-for-help')} className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">+ New Request</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {postedQuestions.length > 0 ? (
                      postedQuestions.map((question) => (
                        <motion.div key={question._id} variants={itemVariants} className="bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${question.status === 'open' ? 'bg-purple-50/50 text-gray-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-200'
                              }`}>
                              {question.status}
                            </span>
                            <span className="text-xs font-semibold text-gray-900">💎 {question.creditsOffered}</span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">{question.title}</h4>
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
                            <span className="text-[10px] font-medium text-gray-500 uppercase">{question.subject}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="text-[10px] font-medium text-gray-500 uppercase">💬 {question.replies} Replies</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full bg-purple-50/50 rounded-xl border border-dashed border-purple-200 p-12 text-center">
                        <p className="text-gray-500 font-medium text-sm">No Questions Posted</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'answered-questions' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight pb-2 border-b border-purple-100">Teaching History</h3>
                  <div className="bg-white rounded-xl border border-purple-100 overflow-hidden shadow-lg shadow-purple-500/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-50/50 border-b border-purple-100">
                          <th className="px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Question</th>
                          <th className="px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Credits Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {answeredQuestions.length > 0 ? (
                          answeredQuestions.map((question) => (
                            <tr key={question._id} className="hover:bg-purple-50/50 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-900 text-sm">{question.title}</td>
                              <td className="px-5 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">{question.subject}</td>
                              <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">+{question.credits}</td>
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
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b border-purple-100">Live Now</h3>
                      {sessions.ongoing.length > 0 ? (
                        sessions.ongoing.map((session) => (
                          <motion.div key={session._id} variants={itemVariants} className="bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 flex justify-between items-center group hover:border-purple-200 transition-colors">
                            <div>
                              <p className="font-semibold text-sm text-gray-900 group-hover:text-gray-600 transition-colors">{session.title}</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase">Peer: {session.peer}</p>
                            </div>
                            <button onClick={() => router.push(`/session/${session._id}`)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-xs hover:from-purple-700 to-indigo-700 transition-colors">Join</button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="bg-purple-50/50 rounded-xl border border-dashed border-purple-200 p-6 text-center">
                          <p className="text-gray-500 text-xs font-medium">No Active Sessions</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b border-purple-100">Scheduled</h3>
                      {sessions.scheduled.length > 0 ? (
                        sessions.scheduled.map((session) => (
                          <div key={session._id} className="bg-white p-5 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{session.title}</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase">Peer: {session.peer}</p>
                            </div>
                            <p className="text-[10px] font-semibold text-gray-700 bg-purple-100 border border-purple-100 px-2 py-1 rounded-lg">{session.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="bg-purple-50/50 rounded-xl border border-dashed border-purple-200 p-6 text-center">
                          <p className="text-gray-500 text-xs font-medium">No Scheduled Sessions</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b border-purple-100">History & Feedback</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessions.completed.map((session) => (
                        <div key={session._id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10">
                          <p className="font-semibold text-gray-900 text-sm truncate">{session.title}</p>
                          <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase">{session.peer}</p>
                          <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100">
                            <button
                              onClick={() => router.push(`/session/${session._id}`)}
                              className="flex-1 py-2 bg-purple-50/50 border border-purple-100 text-gray-700 rounded-xl font-semibold text-[10px] uppercase tracking-wider hover:bg-purple-100 transition-colors"
                            >
                              Log
                            </button>
                            <button
                              onClick={() => router.push(`/quiz/${session._id}`)}
                              className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-[10px] uppercase tracking-wider hover:from-purple-700 to-indigo-700 transition-colors"
                            >
                              Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'credits' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl text-white shadow-lg shadow-purple-500/10 border border-indigo-500/30">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Wallet Balance</p>
                      <p className="text-3xl font-semibold mt-1 tracking-tight">💎 {profile.knowledgeCredits}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Total Earned</p>
                      <p className="text-3xl font-semibold mt-1 text-green-600 tracking-tight">
                        +{transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + Number(t.amount.replace('+', '')), 0)}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Total Spent</p>
                      <p className="text-3xl font-semibold mt-1 text-red-600 tracking-tight">
                        -{transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-purple-100 overflow-hidden shadow-lg shadow-purple-500/10">
                    <div className="px-5 py-4 border-b border-purple-100 flex justify-between items-center bg-purple-50/50/50">
                      <h3 className="font-semibold text-gray-900 text-sm">Transaction Ledger</h3>
                      <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Download CSV</button>
                    </div>
                    <div className="divide-y divide-zinc-200">
                      {transactions.map((t) => (
                        <div key={t._id} className="px-5 py-3 flex justify-between items-center hover:bg-purple-50/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.reason}</p>
                            <p className="text-[10px] font-medium text-gray-500 uppercase mt-0.5">{t.date}</p>
                          </div>
                          <span className={`text-sm font-semibold ${t.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Hall of Fame</h3>
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{badges.filter(b => b.earned).length}/{badges.length} Unlocked</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {badges.map((badge) => (
                      <motion.div
                        key={badge._id}
                        variants={itemVariants}
                        className={`relative p-5 text-center rounded-xl border transition-colors ${badge.earned
                          ? 'bg-white border-purple-100 shadow-lg shadow-purple-500/10 hover:border-purple-200'
                          : 'bg-purple-50/50 border-purple-100 opacity-60 grayscale pointer-events-none'
                          }`}
                      >
                        <div className="text-4xl mb-3 opacity-90">{badge.icon}</div>
                        <p className="font-semibold text-gray-900 text-xs uppercase tracking-tight">{badge.name}</p>
                        <div className="mt-3 pt-3 border-t border-zinc-100">
                          <p className="text-[9px] font-medium text-gray-500 uppercase leading-relaxed">{badge.description}</p>
                        </div>
                        {!badge.earned && (
                          <div className="absolute inset-0 flex items-center justify-center bg-purple-50/50/50 backdrop-blur-[0.5px] rounded-xl">
                            <span className="text-lg opacity-40">🔒</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white p-8 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10">
                    <div>
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-8 border-b border-purple-100">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/10 border border-indigo-500/30">
                          {initials}
                        </div>
                        <div className="text-center md:text-left flex-1 min-w-0">
                          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">{profile.name}</h3>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">{profile.role}</p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="px-3 py-1 bg-purple-50/50 rounded-lg text-[10px] font-medium text-gray-600 border border-purple-100">{profile.email}</span>
                            <span className="px-3 py-1 bg-purple-50/50 rounded-lg text-[10px] font-medium text-gray-600 border border-purple-100">{profile.institution || 'Individual Learner'}</span>
                          </div>
                        </div>
                        <button className="px-4 py-2 border border-purple-100 rounded-xl text-xs font-semibold hover:bg-purple-50/50 transition-colors">Edit Profile</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Expertise Stack</h4>
                            <button
                              onClick={() => setShowExpertiseModal(true)}
                              className="text-[10px] font-medium text-gray-900 uppercase hover:underline"
                            >
                              + Manage
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.expertise.length > 0 ? (
                              profile.expertise.map((entry, index) => (
                                <div key={index} className="group flex items-center gap-2 px-3 py-1.5 bg-purple-50/50 border border-purple-100 rounded-lg hover:border-purple-200 hover:bg-white transition-colors cursor-default">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                  <span className="text-xs font-medium text-gray-700">{entry.subject}</span>
                                  {entry.topic && <span className="text-[9px] font-medium text-gray-400">• {entry.topic}</span>}
                                  <button
                                    onClick={() => handleRemoveExpertise(index)}
                                    className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">No expertise added yet.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Learning Metrics</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                              <span className="text-xs font-medium text-gray-500">Global Reputation</span>
                              <span className="text-xs font-semibold text-gray-900">{profile.reputationPoints} Points</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                              <span className="text-xs font-medium text-gray-500">Preferred Language</span>
                              <span className="text-xs font-semibold text-gray-900">{profile.preferredLanguage}</span>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-r from-purple-600 to-indigo-600/40 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col border border-purple-100 overflow-hidden"
                  >
                    <div className="px-6 py-5 border-b border-purple-100 bg-white">
                      <h3 className="text-lg font-semibold tracking-tight text-gray-900">Add Expertise</h3>
                      <p className="text-xs font-medium text-gray-500 mt-1">Refine your teaching profile</p>
                    </div>

                    <div className="p-6 space-y-5 bg-purple-50/50/50">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Subject</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-1.5"
                          >
                            <label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Topic (Optional)</label>
                            <select
                              value={selectedTopicName}
                              onChange={(e) => setSelectedTopicName(e.target.value)}
                              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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

                    <div className="px-6 py-4 bg-white border-t border-purple-100 flex gap-3 justify-end">
                      <button
                        onClick={() => setShowExpertiseModal(false)}
                        className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateExpertise}
                        disabled={!selectedSubjectId || isUpdatingExpertise}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-medium hover:from-purple-700 to-indigo-700 transition-colors disabled:opacity-50"
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
