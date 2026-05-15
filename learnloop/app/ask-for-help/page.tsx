"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useDoubtAnalyzer } from "@/lib/useGenAIHooks";
import { motion, AnimatePresence } from "framer-motion";

const SUBJECTS_DATA: Record<string, string[]> = {
  "Computer Science": ["Data Structures", "Algorithms", "React", "Node.js", "Python", "AI/ML"],
  "Mathematics": ["Calculus", "Linear Algebra", "Trigonometry", "Probability"],
  "Physics": ["Quantum Mechanics", "Electromagnetism", "Thermodynamics"],
  "Business": ["Marketing", "Finance", "Economics", "Management"],
  "Language": ["English", "Hindi", "Spanish", "French"]
};

export default function AskForHelpPage() {
  const router = useRouter();
  const { userId } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    topic: "",
    urgencyLevel: "medium",
    preferredLanguage: "English",
    creditsOffered: 10,
    sessionDuration: 60,
  });

  const { analyze, loading: analyzing } = useDoubtAnalyzer();

  const handleSmartFill = async () => {
    if (!formData.description.trim()) {
      setError("Please explain your doubt first for AI analysis ✨");
      return;
    }

    try {
      const analysis = await analyze(formData.description);
      if (analysis) {
        // Try to match subject from hardcoded data
        const matchedSubject = Object.keys(SUBJECTS_DATA).find(s => 
          s.toLowerCase().includes(analysis.subject.toLowerCase()) || 
          analysis.subject.toLowerCase().includes(s.toLowerCase())
        );

        setFormData(prev => ({
          ...prev,
          title: prev.title || analysis.title,
          urgencyLevel: analysis.urgency || prev.urgencyLevel,
          subject: matchedSubject || prev.subject
        }));

        if (matchedSubject) {
          const matchedTopic = SUBJECTS_DATA[matchedSubject].find(t => 
            t.toLowerCase().includes(analysis.topic.toLowerCase()) || 
            analysis.topic.toLowerCase().includes(t.toLowerCase())
          );
          if (matchedTopic) {
            setFormData(f => ({ ...f, topic: matchedTopic }));
          }
        }
      }
    } catch (err) {
      console.error("Smart fill failed:", err);
    }
  };

  const subjects = Object.keys(SUBJECTS_DATA);
  const topics = formData.subject ? SUBJECTS_DATA[formData.subject] || [] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditsOffered" || name === "sessionDuration" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/help-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to post request.");
      
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Access Restricted</h1>
          <p className="text-sm text-zinc-500">Join the LearnLoop community to start asking questions.</p>
          <button onClick={() => router.push("/sign-in")} className="px-6 py-2 bg-zinc-900 text-white text-sm rounded-md font-medium hover:bg-zinc-800 transition-colors">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Ask for Help
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Describe your problem and let our community of experts guide you.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.2, ease: 'easeOut' }} className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="bg-green-50 border border-green-200 p-4 rounded-md text-green-700 flex items-center gap-3">
                  <span className="text-sm">✅</span>
                  <p className="font-medium text-sm">Success! Redirecting to your dashboard...</p>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 flex items-center gap-3">
                  <span className="text-sm">⚠️</span>
                  <p className="font-medium text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section 1: Problem Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">Problem Definition</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Struggling with React useEffect hooks"
                    className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-zinc-700">Description</label>
                    <button
                      type="button"
                      onClick={handleSmartFill}
                      disabled={analyzing || !formData.description.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                    >
                      {analyzing ? "Analyzing..." : "✨ Smart Fill"}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Explain your problem in detail."
                    className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 placeholder:text-zinc-400 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Classification */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">Classification</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 appearance-none"
                  >
                    <option value="">Select Domain</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Topic</label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    disabled={!formData.subject}
                    className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 appearance-none disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    <option value="">Select Topic</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Incentives & Logistics */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight border-b border-zinc-200 pb-2">Incentives & Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-zinc-700">Knowledge Credits</label>
                    <span className="text-zinc-900 font-semibold text-sm">{formData.creditsOffered}</span>
                  </div>
                  <input
                    type="range"
                    name="creditsOffered"
                    min="5"
                    max="50"
                    step="5"
                    value={formData.creditsOffered}
                    onChange={handleChange}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 font-medium">
                    <span>Low</span>
                    <span>High Priority</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 block">Urgency Level</label>
                  <div className="flex gap-2 p-1 bg-zinc-100 rounded-md border border-zinc-200">
                    {["low", "medium", "high"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, urgencyLevel: level }))}
                        className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                          formData.urgencyLevel === level
                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                            : "text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Language</label>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 appearance-none cursor-pointer"
                >
                  {["English", "Hindi", "Tamil", "Telugu", "Bengali"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Session Length</label>
                <select
                  name="sessionDuration"
                  value={formData.sessionDuration}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-zinc-900 appearance-none cursor-pointer"
                >
                  {[30, 45, 60, 90, 120].map(t => (
                    <option key={t} value={t}>{t} Minutes</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-6 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 px-4 rounded-md border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] py-2 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Posting..." : "Post Request"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}