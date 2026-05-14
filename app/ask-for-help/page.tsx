"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface Subject {
  _id: string;
  name: string;
}

interface Topic {
  _id: string;
  name: string;
}

export default function AskForHelpPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

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

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/subjects");
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!formData.subject) {
        setTopics([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/subjects?subjectId=${formData.subject}`
        );
        if (!response.ok) throw new Error("Failed to fetch topics");
        const data = await response.json();
        setTopics(data.topics || []);
        // Clear topic selection when subject changes
        setFormData((prev) => ({ ...prev, topic: "" }));
      } catch (err) {
        console.error("Error fetching topics:", err);
      }
    };

    fetchTopics();
  }, [formData.subject]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (!formData.subject) {
      setError("Please select a subject");
      return;
    }
    if (!formData.urgencyLevel) {
      setError("Please select urgency level");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/help-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create help request");
      }

      const data = await response.json();
      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        subject: "",
        topic: "",
        urgencyLevel: "medium",
        preferredLanguage: "English",
        creditsOffered: 10,
        sessionDuration: 60,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create help request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to ask for help
          </p>
          <a
            href="/sign-in"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ask for Help</h1>
          <p className="text-lg text-gray-600">
            Post your question and connect with students who can help
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Create a Help Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Help request posted successfully! Redirecting to dashboard...
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Help with recursion in C++"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific and concise about what you need help with
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Explain your question in detail. What have you tried? What's confusing you?"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                More details = better responses
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Subject <span className="text-red-600">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">
                  {loading ? "Loading subjects..." : "Select a subject"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            {formData.subject && topics.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Topic (Optional)
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Select a topic (optional)</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Urgency Level <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "low", label: "Low", emoji: "🟢" },
                  { value: "medium", label: "Medium", emoji: "🟡" },
                  { value: "high", label: "High", emoji: "🔴" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        urgencyLevel: option.value,
                      }))
                    }
                    className={`p-4 border-2 rounded-lg text-center font-medium transition-all ${formData.urgencyLevel === option.value
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Preferred Language
              </label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                {[
                  "English",
                  "Hindi",
                  "Spanish",
                  "French",
                  "German",
                  "Mandarin",
                  "Tamil",
                  "Telugu",
                  "Kannada",
                  "Bengali",
                ].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Credits Offered */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Credits to Offer
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="creditsOffered"
                  value={formData.creditsOffered}
                  onChange={handleChange}
                  min="5"
                  max="50"
                  step="5"
                  className="flex-1"
                />
                <div className="text-right">
                  <span className="text-2xl font-bold text-purple-600">
                    {formData.creditsOffered}
                  </span>
                  <p className="text-xs text-gray-500">credits</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Higher credits attract more tutors
              </p>
            </div>

            {/* Session Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Session Duration
              </label>
              <select
                name="sessionDuration"
                value={formData.sessionDuration}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                {[30, 45, 60, 90, 120].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? "Posting..." : "Post Help Request"}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for better responses:</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✓ Be specific about what you don't understand</li>
            <li>✓ Share what you've already tried</li>
            <li>✓ Offer reasonable credits for your question</li>
            <li>✓ Specify your preferred language</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
