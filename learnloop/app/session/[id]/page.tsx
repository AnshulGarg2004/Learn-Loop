'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSocket } from '@/lib/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { useMentorChat, useSummaryGenerator, useQuizGenerator } from '@/lib/useGenAIHooks';
import { useRouter } from 'next/navigation';
import Whiteboard from '@/components/whiteboard';
import VideoRoom from '@/components/videocall';

interface AIMentorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SessionPage() {
  const params = useParams();
  const { user } = useUser();
  const sessionId = params.id as string;
  const { isConnected, joinSession, sendMessage, messages, setInitialMessages, resources, shareResource, setInitialResources, onUserJoined, onUserLeft, endSession, onSessionEnded } = useSocket();

  const [chatMessage, setChatMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Tabs & AI Mentor state
  const [activeTab, setActiveTab] = useState<'tutor' | 'ai-mentor' | 'notes'>('tutor');
  const [aiMentorMessages, setAiMentorMessages] = useState<AIMentorMessage[]>([]);
  const [aiMentorInput, setAiMentorInput] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Notes Form State
  const [resourceType, setResourceType] = useState<'link' | 'snippet'>('link');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  const notesEndRef = useRef<HTMLDivElement>(null);

  // AI Hooks
  const { sendMessage: sendAIMessage, loading: aiMentorLoading } = useMentorChat();
  const { generate: generateSummary, loading: summarizing } = useSummaryGenerator();
  const { generate: generateQuiz, loading: quizzing } = useQuizGenerator();

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() 
    : user?.firstName?.slice(0, 2).toUpperCase() || 'U';

  // Completion state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [completingSession, setCompletingSession] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll AI chat to bottom
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMentorMessages]);

  // Scroll Notes to bottom
  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [resources]);

  // Initialize conversation ID
  useEffect(() => {
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  // Join session when socket connects
  useEffect(() => {
    if (isConnected && user && sessionId && typeof sessionId === 'string') {
      const role = (user.publicMetadata?.role as string) || 'student';
      joinSession(sessionId, user.id, user.firstName || 'User', role);
    }
  }, [isConnected, user, sessionId]);

  // Listen for user joined
  useEffect(() => {
    onUserJoined((data) => {
      setConnectedUsers((prev) => [...prev, data]);
    });
  }, []);

  // Listen for user left
  useEffect(() => {
    onUserLeft((data) => {
      setConnectedUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });
  }, []);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionData(data.session);
          if (data.session.messages && data.session.messages.length > 0) {
            setInitialMessages(data.session.messages);
          }
          if (data.session.resources && data.session.resources.length > 0) {
            setInitialResources(data.session.resources);
          }
          if (data.session.aiMessages && data.session.aiMessages.length > 0) {
            setAiMentorMessages(data.session.aiMessages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessage(sessionId, chatMessage);
      setChatMessage('');
    }
  };

  const handleShareResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (resourceTitle.trim() && resourceContent.trim()) {
      shareResource(sessionId, resourceType, resourceContent, resourceTitle, user?.id);
      setResourceTitle('');
      setResourceContent('');
    }
  };

  const handleAIMentorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMentorInput.trim() || aiMentorLoading) return;

    const userMessage = aiMentorInput;
    setAiMentorInput('');

    const newMessages: AIMentorMessage[] = [{
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }];

    // Add user message to local state
    setAiMentorMessages((prev) => [...prev, ...newMessages]);

    try {
      const response = await sendAIMessage(userMessage, conversationId);
      if (response && response.mentorResponse) {
        const aiResponse: AIMentorMessage = {
          role: 'assistant',
          content: response.mentorResponse,
          timestamp: new Date().toISOString(),
        };
        
        setAiMentorMessages((prev) => [...prev, aiResponse]);
        newMessages.push(aiResponse);
      }
    } catch (error: any) {
      console.error('AI mentor error:', error);
      const errorResponse: AIMentorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setAiMentorMessages((prev) => [...prev, errorResponse]);
      newMessages.push(errorResponse);
    }

    // Persist messages to DB asynchronously
    fetch(`/api/session/${sessionId}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    }).catch(err => console.error('Failed to persist AI chat:', err));
  };

  const triggerCompletionFlow = async () => {
    setCompletingSession(true);
    try {
      // 1. Build transcript
      const transcript = messages.map(m => `${m.senderName}: ${m.message}`).join('\n');

      // 2. Generate AI Summary
      const summaryData = await generateSummary(transcript || "No transcript available.");
      setSummary(summaryData);

      // 3. Generate AI Quiz
      const quizData = await generateQuiz(sessionData?.topic || "General Study", "medium", 5);
      setQuiz(quizData);

      setShowSummaryModal(true);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setCompletingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    // Notify other participants via socket
    endSession(sessionId);
    
    // Run completion flow locally
    await triggerCompletionFlow();
  };

  const finalizeSession = async () => {
    const isTutor = sessionData?.tutor?.clerkId === user?.id;
    if (!isTutor) {
      setCompletingSession(true);
      try {
        await fetch(`/api/session/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, feedback })
        });
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }
    router.push('/dashboard');
  };

  // Listen for session ended from others
  useEffect(() => {
    onSessionEnded(() => {
      if (!completingSession && !showSummaryModal) {
        triggerCompletionFlow();
      }
    });
  }, [onSessionEnded, messages, sessionData, completingSession, showSummaryModal]);

  const [viewMode, setViewMode] = useState<'video' | 'whiteboard'>('video');

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-purple-50/50 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-purple-100 border-t-purple-600 rounded-full"
        />
        <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Initializing Workspace</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-purple-50/50 text-gray-900 font-sans overflow-hidden">
      {/* Top Navigation / Header */}
      <header className="h-16 bg-white border-b border-purple-100 px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-purple-500/10 border border-indigo-500/30">
            LL
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-gray-900 leading-none">
              {sessionData?.topic || 'Tutoring Session'}
            </h1>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-1">
              {sessionData?.subject || 'Learning Hub'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-50/50 rounded-xl border border-purple-100">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              {isConnected ? 'Network Stable' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            disabled={completingSession || sessionData?.status === 'completed'}
            className="px-4 py-1.5 bg-white text-red-600 border border-purple-100 rounded-xl text-[10px] font-medium uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50 shadow-lg shadow-purple-500/10"
          >
            {sessionData?.status === 'completed' ? 'Session Ended' : completingSession ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Bar (Vertical) */}
        <nav className="w-16 bg-white border-r border-purple-100 flex flex-col items-center py-6 gap-4 z-20 shrink-0">
          <button
            onClick={() => setViewMode('video')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              viewMode === 'video' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/10' : 'text-gray-500 hover:bg-purple-100 hover:text-gray-900'
            }`}
            title="Video Call"
          >
            <span className="text-lg">🎥</span>
          </button>
          <button
            onClick={() => setViewMode('whiteboard')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              viewMode === 'whiteboard' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/10' : 'text-gray-500 hover:bg-purple-100 hover:text-gray-900'
            }`}
            title="Whiteboard"
          >
            <span className="text-lg">🎨</span>
          </button>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <div className="w-8 h-8 rounded-xl border border-purple-100 p-0.5 overflow-hidden">
               <img src={user?.imageUrl} alt="Me" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        </nav>

        {/* Main Workspace Stage */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-purple-50/50">
          <div className="flex-1 p-4 overflow-hidden">
            <AnimatePresence mode="wait">
              {viewMode === 'video' ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/10 relative overflow-hidden flex flex-col border border-indigo-500/30"
                >
                  {/* Real-time Video Conferencing */}
                  <div className="flex-1 overflow-hidden">
                    <VideoRoom roomId={sessionId} />
                  </div>

                  {/* On-video Controls */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                    <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">🎤</button>
                    <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">📽️</button>
                    <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">🖥️</button>
                    <div className="w-px h-5 bg-white/20 mx-1" />
                    <button onClick={handleEndSession} className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg shadow-purple-500/10">📵</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="whiteboard"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full bg-white rounded-lg shadow-lg shadow-purple-500/10 relative overflow-hidden flex flex-col border border-purple-100"
                >
                   <div className="px-4 py-3 border-b border-purple-100 flex justify-between items-center bg-purple-50/50/50">
                      <div className="flex items-center gap-3">
                         <span className="w-6 h-6 rounded-xl bg-purple-100 flex items-center justify-center text-xs border border-purple-100">🎨</span>
                         <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">Collaborative Whiteboard</h3>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setViewMode('video')}
                           className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[10px] font-medium uppercase tracking-wider hover:from-purple-700 to-indigo-700 transition-colors shadow-lg shadow-purple-500/10 flex items-center gap-2"
                         >
                            <span>🎥</span> Video Call
                         </button>
                         <span className="px-2 py-1 bg-green-50 border border-green-200 rounded-lg text-[9px] font-semibold text-green-700 uppercase tracking-wider">Live Sync</span>
                      </div>
                   </div>
                   <div className="flex-1 relative">
                      <Whiteboard 
                        sessionId={sessionId} 
                        role={sessionData?.tutor?.clerkId === user?.id ? 'tutor' : 'student'} 
                      />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Chat Sidebar */}
        <aside className="w-80 bg-white border-l border-purple-100 flex flex-col z-20 shrink-0">
          <div className="flex border-b border-purple-100 p-2 gap-1 bg-purple-50/50/50">
             <button
                onClick={() => setActiveTab('tutor')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'tutor' ? 'bg-white text-gray-900 shadow-lg shadow-purple-500/10 border border-purple-100' : 'text-gray-500 hover:text-purple-600 border border-transparent'
                }`}
             >
                💬 Chat
             </button>
             <button
                onClick={() => setActiveTab('ai-mentor')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'ai-mentor' ? 'bg-white text-gray-900 shadow-lg shadow-purple-500/10 border border-purple-100' : 'text-gray-500 hover:text-purple-600 border border-transparent'
                }`}
             >
                🤖 AI
             </button>
             <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'notes' ? 'bg-white text-gray-900 shadow-lg shadow-purple-500/10 border border-purple-100' : 'text-gray-500 hover:text-purple-600 border border-transparent'
                }`}
             >
                📚 Notes
             </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === 'tutor' && (
                <motion.div
                  key="tutor-chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-200">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                         <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 text-xl border border-purple-100">📭</div>
                         <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">No Messages Yet</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-2 rounded-xl text-sm font-medium max-w-[85%] border shadow-lg shadow-purple-500/10 ${
                            msg.senderId === user?.id
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-indigo-500/30'
                              : 'bg-white text-gray-900 border-purple-100'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[9px] font-semibold text-gray-500 mt-1 px-1">
                            {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 bg-purple-50/50 border-t border-purple-100 shrink-0">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12"
                      />
                      <button
                        type="submit"
                        disabled={!isConnected || !chatMessage.trim() || sessionData?.status === 'completed'}
                        className="absolute right-1.5 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center hover:from-purple-700 to-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-purple-500/10"
                      >
                        🚀
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'ai-mentor' && (
                <motion.div
                  key="ai-mentor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-200">
                    <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl mb-2">
                       <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-1">AI System Ready</p>
                       <p className="text-xs text-gray-600 font-medium leading-relaxed">I'm analyzing the session in real-time. Ask me anything about the topics discussed.</p>
                    </div>
                    
                    {aiMentorMessages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm font-medium max-w-[85%] border shadow-lg shadow-purple-500/10 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-indigo-500/30'
                            : 'bg-white border-purple-100 text-gray-900'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {aiMentorLoading && (
                      <div className="flex flex-col items-start animate-pulse">
                         <div className="px-3 py-2 rounded-xl bg-purple-100 border border-purple-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">AI is thinking...</div>
                      </div>
                    )}
                    <div ref={aiChatEndRef} />
                  </div>

                  <form onSubmit={handleAIMentorMessage} className="p-4 bg-purple-50/50 border-t border-purple-100 shrink-0">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={aiMentorInput}
                        onChange={(e) => setAiMentorInput(e.target.value)}
                        placeholder="Deep dive into this topic..."
                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12"
                      />
                      <button
                        type="submit"
                        disabled={aiMentorLoading || !aiMentorInput.trim() || sessionData?.status === 'completed'}
                        className="absolute right-1.5 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center hover:from-purple-700 to-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-purple-500/10"
                      >
                        🧠
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-200 bg-purple-50/50">
                    {resources.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                         <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 text-xl border border-purple-100">📚</div>
                         <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">No Notes Shared Yet</p>
                      </div>
                    ) : (
                      resources.map((resource, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-lg shadow-purple-500/10 flex flex-col gap-2">
                           <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2">
                               <span className="w-5 h-5 rounded-lg bg-purple-100 border border-purple-100 flex items-center justify-center text-[10px]">
                                 {resource.resourceType === 'link' ? '🔗' : '📝'}
                               </span>
                               <p className="font-semibold text-gray-900 text-sm">{resource.title}</p>
                             </div>
                             <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                               {new Date(resource.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                           
                           {resource.resourceType === 'link' ? (
                             <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-700 hover:text-gray-900 bg-purple-50/50 border border-purple-100 px-3 py-2 rounded-lg block truncate mt-1 hover:border-purple-200 transition-colors">
                               {resource.fileUrl}
                             </a>
                           ) : (
                             <div className="bg-purple-50/50 text-gray-800 border border-purple-100 text-xs font-mono p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre-wrap max-h-64 scrollbar-thin">
                               {resource.fileUrl}
                             </div>
                           )}
                           
                           {resource.uploadedBy === user?.id && (
                             <p className="text-[9px] font-medium text-gray-400 text-right mt-1">Shared by you</p>
                           )}
                        </div>
                      ))
                    )}
                    <div ref={notesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-purple-100 shrink-0">
                    {sessionData?.status === 'completed' ? (
                      <div className="text-center p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Session Completed</p>
                      </div>
                    ) : (
                      <form onSubmit={handleShareResource} className="flex flex-col gap-3">
                        <div className="flex bg-purple-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setResourceType('link')}
                            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${resourceType === 'link' ? 'bg-white text-gray-900 shadow-lg shadow-purple-500/10 border border-purple-100' : 'text-gray-500 hover:text-purple-600'}`}
                          >
                            🔗 Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setResourceType('snippet')}
                            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${resourceType === 'snippet' ? 'bg-white text-gray-900 shadow-lg shadow-purple-500/10 border border-purple-100' : 'text-gray-500 hover:text-purple-600'}`}
                          >
                            📝 Snippet
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          required
                          value={resourceTitle}
                          onChange={(e) => setResourceTitle(e.target.value)}
                          placeholder="Title (e.g. Google Doc Notes)"
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                        
                        {resourceType === 'link' ? (
                          <input
                            type="url"
                            required
                            value={resourceContent}
                            onChange={(e) => setResourceContent(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          />
                        ) : (
                          <textarea
                            required
                            value={resourceContent}
                            onChange={(e) => setResourceContent(e.target.value)}
                            placeholder="Paste your text or code here..."
                            rows={3}
                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors scrollbar-thin"
                          />
                        )}
                        
                        <button
                          type="submit"
                          disabled={!isConnected || !resourceTitle.trim() || !resourceContent.trim()}
                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:from-purple-700 to-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-purple-500/10"
                        >
                          Share Resource
                        </button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-r from-purple-600 to-indigo-600/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-100"
            >
              <div className="px-8 py-6 border-b border-purple-100 bg-white relative">
                <h2 className="text-xl font-semibold tracking-tight mb-1 text-gray-900">Session Complete! 🎉</h2>
                <p className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Knowledge Sync Successful</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-purple-50/50/30">
                {/* Summary Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                     <span className="text-lg">📝</span>
                     <h3 className="text-sm font-semibold text-gray-900 tracking-tight">AI Insights</h3>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-lg shadow-purple-500/10">
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      "{summary?.conciseSummary || 'Generating your personalized summary...'}"
                    </p>
                    {summary?.importantConcepts && (
                      <div className="mt-4 pt-4 border-t border-purple-100 flex flex-wrap gap-2">
                        {summary.importantConcepts.map((c: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-purple-50/50 border border-purple-100 text-gray-700 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Rating Section (Student only) */}
                {sessionData?.tutor?.clerkId !== user?.id && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="text-lg">⭐</span>
                       <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Rate your Tutor</h3>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-lg shadow-purple-500/10 space-y-5">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-colors hover:scale-105 ${star <= rating ? 'text-yellow-400' : 'text-purple-200 grayscale opacity-50'}`}
                          >
                            {star <= rating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Any extra feedback for the tutor?"
                        className="w-full bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium min-h-[80px]"
                      />
                    </div>
                  </section>
                )}

                {/* Actions */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                     <span className="text-lg">🚀</span>
                     <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Next Milestones</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="p-4 bg-white border border-purple-100 rounded-xl hover:border-purple-400 hover:shadow-lg shadow-purple-500/10 transition-all text-left group flex flex-col justify-center"
                    >
                      <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5 group-hover:text-gray-900 transition-colors">Hub</p>
                      <p className="text-sm font-semibold tracking-tight text-gray-900">Back to Dashboard</p>
                    </button>
                    <button
                      onClick={() => router.push(`/quiz/${sessionId}`)}
                      className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white hover:from-purple-700 to-indigo-700 hover:shadow-lg shadow-purple-500/10 transition-all text-left group flex flex-col justify-center"
                    >
                      <p className="font-medium text-gray-400 uppercase tracking-wider text-[10px] mb-0.5 group-hover:text-purple-300 transition-colors">Challenge</p>
                      <p className="text-sm font-semibold tracking-tight">Take the AI Quiz</p>
                    </button>
                  </div>
                </section>
              </div>

              <div className="px-8 py-5 bg-white border-t border-purple-100 flex justify-end">
                <button
                  onClick={finalizeSession}
                  disabled={completingSession}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-xs hover:from-purple-700 to-indigo-700 transition-colors shadow-lg shadow-purple-500/10 disabled:opacity-50"
                >
                  {completingSession ? 'Saving...' : 'Save & Finish'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
