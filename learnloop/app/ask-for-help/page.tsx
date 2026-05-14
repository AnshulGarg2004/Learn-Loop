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

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/subjects");

        if (!response.ok) {
          throw new Error("Failed to fetch subjects");
        }

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

        if (!response.ok) {
          throw new Error("Failed to fetch topics");
        }

        const data = await response.json();

        setTopics(data.topics || []);
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
      [name]:
        name === "creditsOffered" || name === "sessionDuration"
          ? Number(value)
          : value,
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

    try {
      setSubmitting(true);

      console.log("Submitting form:", formData);

      // Build payload - exclude empty subject
      const payload = {
        title: formData.title,
        description: formData.description,
        urgencyLevel: formData.urgencyLevel,
        preferredLanguage: formData.preferredLanguage,
        creditsOffered: formData.creditsOffered,
        sessionDuration: formData.sessionDuration,
      } as any;

      // Only add subject if it's not empty
      if (formData.subject) {
        payload.subject = formData.subject;
      }

      // Only add topic if it's not empty
      if (formData.topic) {
        payload.topic = formData.topic;
      }

      const response = await fetch("/api/help-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create help request");
      }

      setSuccess(true);

      // Reset form
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

      setTopics([]);

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // If user not logged in
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in required
          </h1>

          <p className="text-gray-600 mb-6">
            Please sign in to ask for help
          </p>

          <a
            href="/sign-in"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ask for Help
          </h1>

          <p className="text-lg text-gray-600">
            Post your question and connect with students who can help
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Create a Help Request
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Success */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Help request posted successfully!
                </p>
              </div>
            )}

            {/* Error */}
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
                placeholder="Help with recursion in C++"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
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
                rows={5}
                required
                placeholder="Explain your problem in detail..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
              />
            </div>



            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Urgency Level
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
                    className={`p-4 border-2 rounded-lg transition-all ${formData.urgencyLevel === option.value
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                      }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>

                    <p className="font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Preferred Language
              </label>

              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {[
                  "English",
                  "Hindi",
                  "Tamil",
                  "Telugu",
                  "Bengali",
                ].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Credits */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Credits Offered
              </label>

              <input
                type="range"
                name="creditsOffered"
                min="5"
                max="50"
                step="5"
                value={formData.creditsOffered}
                onChange={handleChange}
                className="w-full"
              />

              <p className="mt-2 text-purple-600 font-bold">
                {formData.creditsOffered} Credits
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Session Duration
              </label>

              <select
                name="sessionDuration"
                value={formData.sessionDuration}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {[30, 45, 60, 90, 120].map((time) => (
                  <option key={time} value={time}>
                    {time} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Help Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}