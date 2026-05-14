'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSocket } from '@/lib/useSocket';
import { motion } from 'framer-motion';

interface AIMentorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SessionPage() {
  const params = useParams();
  const { user } = useUser();
  const sessionId = params.id as string;
  const { isConnected, joinSession, sendMessage, messages, onUserJoined, onUserLeft } = useSocket();

  const [chatMessage, setChatMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // AI Mentor state
  const [activeTab, setActiveTab] = useState<'tutor' | 'ai-mentor'>('tutor');
  const [aiMentorMessages, setAiMentorMessages] = useState<AIMentorMessage[]>([]);
  const [aiMentorInput, setAiMentorInput] = useState('');
  const [aiMentorLoading, setAiMentorLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll AI chat to bottom
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMentorMessages]);

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

  const handleAIMentorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMentorInput.trim()) return;

    // Add user message to chat
    const userMsg: AIMentorMessage = {
      role: 'user',
      content: aiMentorInput,
      timestamp: new Date().toISOString(),
    };
    setAiMentorMessages((prev) => [...prev, userMsg]);
    setAiMentorInput('');
    setAiMentorLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: aiMentorInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI mentor response');
      }

      const data = await response.json();
      const assistantMsg: AIMentorMessage = {
        role: 'assistant',
        content: data.data?.mentorResponse || 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      setAiMentorMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('AI mentor error:', error);
      const errorMsg: AIMentorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setAiMentorMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAiMentorLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-sky-50 to-fuchsia-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Video/Whiteboard Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col gap-4"
        >
          {/* Session Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-sky-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Tutoring Session
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {sessionData?.subject || 'Loading...'} • {sessionData?.topic || 'Loading...'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isConnected ? '● Connected' : '● Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Video Conference Placeholder */}
          <div className="flex-1 bg-linear-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg flex items-center justify-center min-h-96 text-white border border-slate-700">
            <div className="text-center">
              <div className="mb-4 text-6xl">🎥</div>
              <h2 className="text-xl font-semibold mb-2">Video Conference</h2>
              <p className="text-slate-400 mb-4">Implement WebRTC/Agora here</p>
              <p className="text-sm text-slate-500">Connected users: {connectedUsers.length + 1}</p>
              {connectedUsers.map((u) => (
                <p key={u.socketId} className="text-xs text-slate-400">
                  • {u.userName} ({u.role})
                </p>
              ))}
            </div>
          </div>

          {/* Whiteboard */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Shared Whiteboard</h3>
            <div className="w-full h-64 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-400">
                <p className="text-lg mb-2">🎨</p>
                <p className="text-sm">Whiteboard canvas (implement with Canvas API)</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-lg border border-slate-200"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === 'tutor'
                  ? 'text-fuchsia-600 border-b-2 border-fuchsia-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍🏫 Tutor Chat
            </button>
            <button
              onClick={() => setActiveTab('ai-mentor')}
              className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === 'ai-mentor'
                  ? 'text-sky-600 border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🤖 AI Mentor
            </button>
          </div>

          {/* Tutor Chat Tab */}
          {activeTab === 'tutor' && (
            <>
              {/* Chat Header */}
              <div className="bg-linear-to-r from-sky-600 to-fuchsia-600 text-white p-4">
                <h3 className="font-semibold">Tutor Chat</h3>
                <p className="text-xs opacity-90">{connectedUsers.length + 1} people online</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-96">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-400 text-center">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.senderId === user?.id
                            ? 'bg-fuchsia-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-xs opacity-75 mb-1">{msg.senderName}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected}
                    className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg font-medium text-sm hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}

          {/* AI Mentor Tab */}
          {activeTab === 'ai-mentor' && (
            <>
              {/* Chat Header */}
              <div className="bg-linear-to-r from-sky-500 to-cyan-500 text-white p-4">
                <h3 className="font-semibold">AI Mentor</h3>
                <p className="text-xs opacity-90">Your personal AI tutor</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-96">
                {aiMentorMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-400 text-center">Ask the AI Mentor for help!</p>
                  </div>
                ) : (
                  aiMentorMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-sky-600 text-white'
                            : 'bg-cyan-100 text-slate-900'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                {aiMentorLoading && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-start"
                  >
                    <div className="px-3 py-2 rounded-lg bg-cyan-100 text-slate-900">
                      <p className="text-sm">AI Mentor is thinking...</p>
                    </div>
                  </motion.div>
                )}
                <div ref={aiChatEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleAIMentorMessage} className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiMentorInput}
                    onChange={(e) => setAiMentorInput(e.target.value)}
                    placeholder="Ask the AI mentor..."
                    disabled={aiMentorLoading}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={aiMentorLoading}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
