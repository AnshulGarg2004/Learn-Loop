"use client";

import { useState } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            await completeOnboarding(formData);
        } catch (err: any) {
            setError(err.message || "An error occurred during onboarding.");
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
                <div className="bg-purple-600 px-8 py-10 text-center">
                    <h2 className="text-3xl font-extrabold text-white mb-2">Welcome to LearnLoop, {user?.firstName || "Learner"}!</h2>
                    <p className="text-purple-100 text-lg">Let's set up your profile to personalize your experience.</p>
                </div>

                <div className="px-8 py-10">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">I want to...</label>
                            <div className="grid grid-cols-3 gap-4">
                                <label className="cursor-pointer">
                                    <input type="radio" name="role" value="student" className="peer sr-only" required defaultChecked />
                                    <div className="text-center px-4 py-3 rounded-lg border-2 border-gray-200 peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:bg-gray-50 transition-all">
                                        Learn
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input type="radio" name="role" value="tutor" className="peer sr-only" required />
                                    <div className="text-center px-4 py-3 rounded-lg border-2 border-gray-200 peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:bg-gray-50 transition-all">
                                        Teach
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input type="radio" name="role" value="both" className="peer sr-only" required />
                                    <div className="text-center px-4 py-3 rounded-lg border-2 border-gray-200 peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:bg-gray-50 transition-all">
                                        Both
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* College */}
                        <div>
                            <label htmlFor="college" className="block text-sm font-semibold text-gray-700 mb-2">
                                College / Institution
                            </label>
                            <input
                                type="text"
                                name="college"
                                id="college"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                                placeholder="e.g. Stanford University"
                            />
                        </div>

                        {/* Skills */}
                        <div>
                            <label htmlFor="skills" className="block text-sm font-semibold text-gray-700 mb-2">
                                Skills <span className="text-gray-400 font-normal">(Comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                name="skills"
                                id="skills"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                                placeholder="e.g. React, Python, Data Analysis"
                            />
                        </div>

                        {/* Subjects */}
                        <div>
                            <label htmlFor="subjects" className="block text-sm font-semibold text-gray-700 mb-2">
                                Subjects <span className="text-gray-400 font-normal">(Comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                name="subjects"
                                id="subjects"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                                placeholder="e.g. Computer Science, Mathematics"
                            />
                        </div>

                        {/* Languages */}
                        <div>
                            <label htmlFor="languages" className="block text-sm font-semibold text-gray-700 mb-2">
                                Languages <span className="text-gray-400 font-normal">(Comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                name="languages"
                                id="languages"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                                placeholder="e.g. English, Spanish"
                            />
                        </div>

                        {/* Learning Interests */}
                        <div>
                            <label htmlFor="learningInterests" className="block text-sm font-semibold text-gray-700 mb-2">
                                Learning Interests <span className="text-gray-400 font-normal">(Comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                name="learningInterests"
                                id="learningInterests"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                                placeholder="e.g. Machine Learning, Web Design"
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center shadow-lg hover:shadow-xl disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving Profile...
                                    </>
                                ) : (
                                    "Complete Setup"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
