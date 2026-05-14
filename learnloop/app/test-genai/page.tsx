'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface TestResult {
  loading: boolean;
  result: any;
  error: string | null;
}

export default function TestGenAIPage() {
  const [activeTab, setActiveTab] = useState<'doubt' | 'quiz' | 'summary' | 'chat'>('doubt');

  // Doubt Analyzer
  const [doubtInput, setDoubtInput] = useState('What is photosynthesis?');
  const [doubtResult, setDoubtResult] = useState<TestResult>({
    loading: false,
    result: null,
    error: null,
  });

  // Quiz Generator
  const [quizTopic, setQuizTopic] = useState('Photosynthesis');
  const [quizDifficulty, setQuizDifficulty] = useState('intermediate');
  const [quizCount, setQuizCount] = useState(3);
  const [quizResult, setQuizResult] = useState<TestResult>({
    loading: false,
    result: null,
    error: null,
  });

  // Summary Generator
  const [summaryInput, setSummaryInput] = useState(
    `Tutor: Today we learned about photosynthesis. It's the process where plants convert sunlight into chemical energy.
Student: So plants eat sunlight?
Tutor: Not exactly. They use light energy to create glucose from water and carbon dioxide.
Student: That's cool! How long does it take?
Tutor: It happens very quickly, in microseconds during the light reactions.`
  );
  const [summaryResult, setSummaryResult] = useState<TestResult>({
    loading: false,
    result: null,
    error: null,
  });

  // Chat
  const [chatMessage, setChatMessage] = useState('Explain how photosynthesis works');
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Test Doubt Analyzer
  const testDoubtAnalyzer = async () => {
    setDoubtResult({ loading: true, result: null, error: null });
    try {
      const response = await fetch('/api/ai/analyze-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtText: doubtInput }),
      });

      const data = await response.json();
      if (!response.ok) {
        setDoubtResult({
          loading: false,
          result: null,
          error: data.error || 'Failed to analyze doubt',
        });
      } else {
        setDoubtResult({
          loading: false,
          result: data.data,
          error: null,
        });
      }
    } catch (err: any) {
      setDoubtResult({
        loading: false,
        result: null,
        error: err.message || 'Network error',
      });
    }
  };

  // Test Quiz Generator
  const testQuizGenerator = async () => {
    setQuizResult({ loading: true, result: null, error: null });
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: quizDifficulty,
          numberOfQuestions: quizCount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setQuizResult({
          loading: false,
          result: null,
          error: data.error || 'Failed to generate quiz',
        });
      } else {
        setQuizResult({
          loading: false,
          result: data.data,
          error: null,
        });
      }
    } catch (err: any) {
      setQuizResult({
        loading: false,
        result: null,
        error: err.message || 'Network error',
      });
    }
  };

  // Test Summary Generator
  const testSummaryGenerator = async () => {
    setSummaryResult({ loading: true, result: null, error: null });
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: summaryInput }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSummaryResult({
          loading: false,
          result: null,
          error: data.error || 'Failed to generate summary',
        });
      } else {
        setSummaryResult({
          loading: false,
          result: data.data,
          error: null,
        });
      }
    } catch (err: any) {
      setSummaryResult({
        loading: false,
        result: null,
        error: err.message || 'Network error',
      });
    }
  };

  // Test Chat
  const testChat = async () => {
    setChatLoading(true);
    setChatError(null);

    const newConvId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage,
          conversationId: newConvId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setChatError(data.error || 'Failed to send message');
      } else {
        setConversationId(newConvId);
        setChatMessages((prev) => [
          ...prev,
          { role: 'user', text: chatMessage },
          { role: 'assistant', text: data.data?.mentorResponse },
        ]);
        setChatMessage('');
      }
    } catch (err: any) {
      setChatError(err.message || 'Network error');
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setConversationId('');
    setChatMessage('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50 to-fuchsia-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-linear-to-r from-sky-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            🧪 GenAI Testing Dashboard
          </h1>
          <p className="text-slate-600">Test all GenAI features in one place</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['doubt', 'quiz', 'summary', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-fuchsia-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-fuchsia-400'
              }`}
            >
              {tab === 'doubt' && '📊 Doubt Classifier'}
              {tab === 'quiz' && '❓ Quiz Generator'}
              {tab === 'summary' && '📝 Summary Generator'}
              {tab === 'chat' && '🤖 AI Mentor Chat'}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Doubt Classifier Tab */}
          {activeTab === 'doubt' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold mb-4 text-slate-800">📊 Doubt Classifier</h2>
              <p className="text-slate-600 mb-4">
                Analyzes student doubts and extracts urgency level, difficulty, subject, and topic
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter a doubt or question:
                  </label>
                  <textarea
                    value={doubtInput}
                    onChange={(e) => setDoubtInput(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="E.g., What is photosynthesis?"
                  />
                </div>

                <button
                  onClick={testDoubtAnalyzer}
                  disabled={doubtResult.loading}
                  className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
                >
                  {doubtResult.loading ? '🔄 Analyzing...' : '✨ Analyze Doubt'}
                </button>

                {doubtResult.error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ❌ Error: {doubtResult.error}
                  </div>
                )}

                {doubtResult.result && (
                  <div className="p-4 bg-green-50 border border-green-300 rounded-lg space-y-3">
                    <h3 className="font-bold text-green-800">✅ Analysis Result:</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-xs text-slate-500 uppercase">Title</p>
                        <p className="font-semibold text-slate-800">{doubtResult.result.title}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-xs text-slate-500 uppercase">Subject</p>
                        <p className="font-semibold text-slate-800">{doubtResult.result.subject}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-xs text-slate-500 uppercase">Difficulty</p>
                        <p className="font-semibold text-slate-800">
                          {doubtResult.result.difficulty} 📈
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-xs text-slate-500 uppercase">Urgency</p>
                        <p className="font-semibold text-slate-800">
                          {doubtResult.result.urgency} 🔴
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-slate-500 uppercase mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {doubtResult.result.tags?.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-fuchsia-100 text-fuchsia-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <pre className="bg-white p-3 rounded overflow-auto text-xs text-slate-600 border border-green-200">
                      {JSON.stringify(doubtResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz Generator Tab */}
          {activeTab === 'quiz' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold mb-4 text-slate-800">❓ Quiz Generator</h2>
              <p className="text-slate-600 mb-4">
                Generate multiple-choice questions on any topic
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Topic:
                    </label>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g., Photosynthesis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Difficulty:
                    </label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option>easy</option>
                      <option>medium</option>
                      <option>hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Questions:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={quizCount}
                      onChange={(e) => setQuizCount(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  onClick={testQuizGenerator}
                  disabled={quizResult.loading}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  {quizResult.loading ? '🔄 Generating...' : '✨ Generate Quiz'}
                </button>

                {quizResult.error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ❌ Error: {quizResult.error}
                  </div>
                )}

                {quizResult.result && (
                  <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
                    <h3 className="font-bold text-blue-800">✅ Generated Quiz:</h3>
                    {quizResult.result.questions?.map((q: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded border border-blue-200">
                        <p className="font-semibold mb-2 text-slate-800">
                          Q{idx + 1}: {q.question}
                        </p>
                        <div className="space-y-1 mb-2 text-sm">
                          {q.options?.map((opt: string, i: number) => (
                            <div
                              key={i}
                              className={`p-2 rounded ${
                                i === q.correctAnswer
                                  ? 'bg-green-100 text-green-800 font-semibold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 italic">📖 {q.explanation}</p>
                      </div>
                    ))}
                    <pre className="bg-white p-3 rounded overflow-auto text-xs text-slate-600 border border-blue-200">
                      {JSON.stringify(quizResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Generator Tab */}
          {activeTab === 'summary' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold mb-4 text-slate-800">📝 Summary Generator</h2>
              <p className="text-slate-600 mb-4">
                Generate multi-format summaries from session transcripts
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Transcript:
                  </label>
                  <textarea
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                  />
                </div>

                <button
                  onClick={testSummaryGenerator}
                  disabled={summaryResult.loading}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  {summaryResult.loading ? '🔄 Generating...' : '✨ Generate Summary'}
                </button>

                {summaryResult.error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ❌ Error: {summaryResult.error}
                  </div>
                )}

                {summaryResult.result && (
                  <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-4">
                    <h3 className="font-bold text-blue-800">✅ Generated Summary:</h3>

                    <div className="bg-white p-4 rounded border border-blue-200">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                        Concise Summary
                      </p>
                      <p className="text-slate-800">{summaryResult.result.conciseSummary}</p>
                    </div>

                    {summaryResult.result.bulletNotes && summaryResult.result.bulletNotes.length > 0 && (
                      <div className="bg-white p-4 rounded border border-blue-200">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                          Bullet Notes
                        </p>
                        <ul className="space-y-1 text-slate-800 text-sm">
                          {summaryResult.result.bulletNotes.map((note: string, i: number) => (
                            <li key={i}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summaryResult.result.importantConcepts && summaryResult.result.importantConcepts.length > 0 && (
                      <div className="bg-white p-4 rounded border border-blue-200">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                          Important Concepts
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {summaryResult.result.importantConcepts.map((concept: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {summaryResult.result.keyTakeaway && (
                      <div className="bg-gradient-to-r from-sky-100 to-fuchsia-100 p-4 rounded border-l-4 border-sky-600">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                          🎯 Key Takeaway
                        </p>
                        <p className="text-slate-800 font-semibold">{summaryResult.result.keyTakeaway}</p>
                      </div>
                    )}

                    <pre className="bg-white p-3 rounded overflow-auto text-xs text-slate-600 border border-blue-200">
                      {JSON.stringify(summaryResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 flex flex-col h-[600px]">
              <h2 className="text-2xl font-bold mb-4 text-slate-800">🤖 AI Mentor Chat</h2>
              <p className="text-slate-600 mb-4">
                Chat with the AI Mentor. Conversation ID: {conversationId || 'Not started yet'}
              </p>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-400 text-center text-sm py-8">
                    No messages yet. Start a conversation!
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-sky-600 text-white rounded-br-none'
                            : 'bg-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg">
                      <p className="text-sm">AI Mentor is thinking...</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {chatError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4 text-sm">
                  ❌ Error: {chatError}
                </div>
              )}

              {/* Message Input */}
              <div className="space-y-3">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !chatLoading) {
                      e.preventDefault();
                      testChat();
                    }
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  placeholder="Ask me anything... (Shift+Enter for new line)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={testChat}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="flex-1 px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
                  >
                    {chatLoading ? '🔄 Sending...' : '✨ Send Message'}
                  </button>
                  <button
                    onClick={clearChat}
                    disabled={chatMessages.length === 0 || chatLoading}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 disabled:opacity-50 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center text-slate-600 text-sm">
          <p>🚀 GenAI Testing Dashboard | Make sure GROQ_API_KEY is set in .env.local</p>
        </motion.div>
      </div>
    </div>
  );
}
