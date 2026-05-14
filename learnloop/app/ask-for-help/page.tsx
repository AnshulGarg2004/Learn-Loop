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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-slate-500 font-medium">Join the LearnLoop community to start asking questions.</p>
          <button onClick={() => router.push("/sign-in")} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
            Knowledge Exchange
          </span>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            What are you <span className="text-indigo-600">struggling with?</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
            Describe your problem and let our community of student experts guide you.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <p className="font-bold text-sm">Success! Redirecting to your dashboard...</p>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="font-bold text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section 1: Problem Details */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">1</div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Problem Definition</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Catchy Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Struggling with React useEffect hooks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Description</label>
                    <button
                      type="button"
                      onClick={handleSmartFill}
                      disabled={analyzing || !formData.description.trim()}
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-30 transition-all"
                    >
                      {analyzing ? "🧠 Analyzing..." : "✨ AI Smart Fill"}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Explain your problem in detail. The more info, the better!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold placeholder:text-slate-300 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Classification */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 font-black text-sm shadow-sm">2</div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Classification</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-semibold appearance-none cursor-pointer"
                  >
                    <option value="">Select Domain</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Specific Topic</label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    disabled={!formData.subject}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-semibold appearance-none disabled:opacity-30 cursor-pointer"
                  >
                    <option value="">Select Topic</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Incentives */}
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 font-black text-sm shadow-sm">3</div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Incentives & Priority</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Knowledge Credits</label>
                    <span className="text-indigo-600 font-black text-xl">💎 {formData.creditsOffered}</span>
                  </div>
                  <input
                    type="range"
                    name="creditsOffered"
                    min="5"
                    max="50"
                    step="5"
                    value={formData.creditsOffered}
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <span>Low Reward</span>
                    <span>High Priority</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Urgency Level</label>
                  <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.25rem] border border-slate-200">
                    {["low", "medium", "high"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, urgencyLevel: level }))}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.urgencyLevel === level
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                            : "text-slate-400 hover:text-slate-600"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Language Preference</label>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-semibold appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                >
                  {["English", "Hindi", "Tamil", "Telugu", "Bengali"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Session Length</label>
                <select
                  name="sessionDuration"
                  value={formData.sessionDuration}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-semibold appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                >
                  {[30, 45, 60, 90, 120].map(t => (
                    <option key={t} value={t}>{t} Minutes</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-12 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? "🚀 Broadcasting..." : "✨ Post Help Request"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}