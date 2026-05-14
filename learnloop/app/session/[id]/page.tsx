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
      shareResource(sessionId, resourceType, resourceContent, resourceTitle);
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
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
        />
        <p className="text-slate-500 font-bold text-sm animate-pulse tracking-widest uppercase">Initializing Session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Top Navigation / Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
            LL
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
              {sessionData?.topic || 'Tutoring Session'}
            </h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
              {sessionData?.subject || 'Learning Hub'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {isConnected ? 'Network Stable' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            disabled={completingSession || sessionData?.status === 'completed'}
            className="px-6 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            {sessionData?.status === 'completed' ? 'Session Ended' : completingSession ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Bar (Vertical) */}
        <nav className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20 shrink-0">
          <button
            onClick={() => setViewMode('video')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              viewMode === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
            }`}
            title="Video Call"
          >
            <span className="text-xl">🎥</span>
          </button>
          <button
            onClick={() => setViewMode('whiteboard')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              viewMode === 'whiteboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
            }`}
            title="Whiteboard"
          >
            <span className="text-xl">🎨</span>
          </button>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-100 p-0.5 overflow-hidden">
               <img src={user?.imageUrl} alt="Me" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </nav>

        {/* Main Workspace Stage */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-slate-50">
          <div className="flex-1 p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {viewMode === 'video' ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full h-full bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border-4 border-white"
                >
                  {/* Real-time Video Conferencing */}
                  <div className="flex-1 overflow-hidden">
                    <VideoRoom roomId={sessionId} />
                  </div>

                  {/* On-video Controls */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">🎤</button>
                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">📽️</button>
                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">🖥️</button>
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <button onClick={handleEndSession} className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-500/20">📵</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="whiteboard"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-slate-200"
                >
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-3">
                         <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">🎨</span>
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Collaborative Whiteboard</h3>
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => setViewMode('video')}
                           className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                         >
                            <span>🎥</span> Join Video Call
                         </button>
                         <span className="px-3 py-1 bg-indigo-50 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Live Syncing</span>
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
        <aside className="w-[22rem] bg-white border-l border-slate-200 flex flex-col z-20 shrink-0">
          <div className="flex border-b border-slate-200 p-2 gap-1">
             <button
                onClick={() => setActiveTab('tutor')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'tutor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'
                }`}
             >
                💬 Chat
             </button>
             <button
                onClick={() => setActiveTab('ai-mentor')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'ai-mentor' ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'text-slate-400 hover:text-slate-600'
                }`}
             >
                🤖 AI
             </button>
             <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'notes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'
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
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                         <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-3xl">📭</div>
                         <p className="text-[10px] font-black uppercase tracking-widest">No Messages Yet</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium max-w-[85%] ${
                            msg.senderId === user?.id
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                              : 'bg-slate-100 text-slate-900 rounded-bl-none'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2 px-1">
                            {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Say something nice..."
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium pr-12"
                      />
                      <button
                        type="submit"
                        disabled={!isConnected || !chatMessage.trim() || sessionData?.status === 'completed'}
                        className="absolute right-2 top-2 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-sm"
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
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl mb-2">
                       <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">AI System Ready</p>
                       <p className="text-xs text-violet-800 font-medium leading-relaxed">I'm analyzing the session in real-time. Ask me anything about the topics discussed!</p>
                    </div>
                    
                    {aiMentorMessages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium max-w-[85%] ${
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-none shadow-md'
                            : 'bg-white border border-violet-200 text-slate-900 rounded-bl-none shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {aiMentorLoading && (
                      <div className="flex flex-col items-start animate-pulse">
                         <div className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-sm font-bold uppercase tracking-widest">AI is thinking...</div>
                      </div>
                    )}
                    <div ref={aiChatEndRef} />
                  </div>

                  <form onSubmit={handleAIMentorMessage} className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <div className="relative">
                      <input
                        type="text"
                        value={aiMentorInput}
                        onChange={(e) => setAiMentorInput(e.target.value)}
                        placeholder="Deep dive into this topic..."
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-600 transition-all font-medium pr-12"
                      />
                      <button
                        type="submit"
                        disabled={aiMentorLoading || !aiMentorInput.trim() || sessionData?.status === 'completed'}
                        className="absolute right-2 top-2 w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 disabled:opacity-30 transition-all shadow-sm"
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
                  className="absolute inset-0 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50">
                    {resources.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                         <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-3xl">📚</div>
                         <p className="text-[10px] font-black uppercase tracking-widest">No Notes Shared Yet</p>
                      </div>
                    ) : (
                      resources.map((resource, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                           <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2">
                               <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${resource.resourceType === 'link' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                 {resource.resourceType === 'link' ? '🔗' : '📝'}
                               </span>
                               <p className="font-bold text-slate-900 text-sm">{resource.title}</p>
                             </div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(resource.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                           
                           {resource.resourceType === 'link' ? (
                             <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl block truncate mt-1">
                               {resource.fileUrl}
                             </a>
                           ) : (
                             <div className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono p-4 rounded-xl mt-2 overflow-x-auto whitespace-pre-wrap max-h-64 scrollbar-thin">
                               {resource.fileUrl}
                             </div>
                           )}
                           
                           {resource.uploadedBy === user?.id && (
                             <p className="text-[9px] font-black text-slate-400 text-right mt-1">Shared by you</p>
                           )}
                        </div>
                      ))
                    )}
                    <div ref={notesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    {sessionData?.status === 'completed' ? (
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session Completed</p>
                      </div>
                    ) : (
                      <form onSubmit={handleShareResource} className="flex flex-col gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setResourceType('link')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${resourceType === 'link' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                          >
                            🔗 Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setResourceType('snippet')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${resourceType === 'snippet' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
                        />
                        
                        {resourceType === 'link' ? (
                          <input
                            type="url"
                            required
                            value={resourceContent}
                            onChange={(e) => setResourceContent(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                          />
                        ) : (
                          <textarea
                            required
                            value={resourceContent}
                            onChange={(e) => setResourceContent(e.target.value)}
                            placeholder="Paste your text or code here..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium scrollbar-thin"
                          />
                        )}
                        
                        <button
                          type="submit"
                          disabled={!isConnected || !resourceTitle.trim() || !resourceContent.trim()}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white"
            >
              <div className="p-10 border-b border-slate-100 bg-linear-to-br from-indigo-600 to-violet-700 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl font-black italic">LEARN</div>
                <h2 className="text-4xl font-black tracking-tight mb-2 relative z-10">Session Complete! 🎉</h2>
                <p className="font-bold opacity-80 uppercase tracking-[0.3em] text-xs relative z-10">Knowledge Sync Successful</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                {/* Summary Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl">📝</div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Insights</h3>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                    <p className="text-slate-600 leading-relaxed font-medium italic">
                      "{summary?.conciseSummary || 'Generating your personalized summary...'}"
                    </p>
                    {summary?.importantConcepts && (
                      <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-2">
                        {summary.importantConcepts.map((c: string, i: number) => (
                          <span key={i} className="px-4 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Rating Section (Student only) */}
                {sessionData?.tutor?.clerkId !== user?.id && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">⭐</div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">Rate your Tutor</h3>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
                      <div className="flex justify-center gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-4xl transition-all transform hover:scale-110 ${star <= rating ? 'grayscale-0' : 'grayscale opacity-30'}`}
                          >
                            {star <= rating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Any extra feedback for the tutor?"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium min-h-[100px]"
                      />
                    </div>
                  </section>
                )}

                {/* Actions */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-xl">🚀</div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Next Milestones</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all text-left group"
                    >
                      <p className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-1 group-hover:text-indigo-600">Hub</p>
                      <p className="text-lg font-black tracking-tight">Back to Dashboard</p>
                    </button>
                    <button
                      onClick={() => router.push(`/quiz/${sessionId}`)}
                      className="p-6 bg-indigo-600 rounded-3xl text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all text-left group"
                    >
                      <p className="font-black text-white/60 uppercase tracking-widest text-[10px] mb-1">Challenge</p>
                      <p className="text-lg font-black tracking-tight">Take the AI Quiz</p>
                    </button>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button
                  onClick={finalizeSession}
                  disabled={completingSession}
                  className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 shadow-lg disabled:opacity-50"
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
