"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
    const router = useRouter();
    const { userId } = useAuth();
    return (
        <div className="w-full bg-white">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">LearnLoop</div>
                    <div className="flex items-center gap-6">
                        {userId ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-colors shadow-md shadow-purple-500/20"
                                >
                                    Dashboard
                                </button>
                                <UserButton />
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/sign-in"
                                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-colors shadow-md shadow-purple-500/20"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-white via-purple-50 to-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Learn. Teach. <span className="text-purple-600">Grow Together</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        A peer-to-peer learning ecosystem where students teach each other and earn
                        Knowledge Credits. No expensive tutors. Just real learning, real help, real growth.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {!userId && (
                            <>
                                <button

                                    className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                                >
                                    Get Started Free
                                </button>
                                <button

                                    className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-semibold text-lg transition-colors"
                                >
                                    Learn More
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">100</div>
                        <p className="text-gray-600">Free Knowledge Credits</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">∞</div>
                        <p className="text-gray-600">Learning Opportunities</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">0₹</div>
                        <p className="text-gray-600">Transaction Fees</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
                        Why Choose LearnLoop?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">🎓</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Peer Learning</h3>
                            <p className="text-gray-600">
                                Learn directly from students who've mastered the topics. Real explanations
                                from real peers.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Knowledge Credits</h3>
                            <p className="text-gray-600">
                                Earn credits by helping others. Spend credits to get help. A fair,
                                incentive-driven system.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">⭐</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Build Reputation</h3>
                            <p className="text-gray-600">
                                Earn badges, rating points, and build your mentorship profile as you
                                teach others.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">🎥</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Live Sessions</h3>
                            <p className="text-gray-600">
                                Connect via video, audio, or chat. Use shared whiteboards for instant
                                problem-solving.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">🛡️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Users</h3>
                            <p className="text-gray-600">
                                All tutors are verified students with proven expertise. Quality assurance
                                through community.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">🤝</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
                            <p className="text-gray-600">
                                No algorithms. Real human connection. Transparent mentorship and
                                collaboration.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section
                id="how-it-works"
                className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 border-y border-gray-100"
            >
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            {[
                                {
                                    step: "1",
                                    title: "Sign Up",
                                    description:
                                        "Create your profile and tell us what you're good at and what you want to learn.",
                                },
                                {
                                    step: "2",
                                    title: "Get Credits",
                                    description: "Start with 100 free Knowledge Credits. No payment needed.",
                                },
                                {
                                    step: "3",
                                    title: "Request or Offer Help",
                                    description:
                                        "Post a help request or offer to teach topics in your expertise.",
                                },
                                {
                                    step: "4",
                                    title: "Connect & Learn",
                                    description:
                                        "Get matched with peers. Have live sessions. Learn and teach.",
                                },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-600 text-white font-bold text-lg">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                                        <p className="text-gray-600 mt-1">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">🚀</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h3>
                            <p className="text-gray-600 mb-6">
                                Join thousands of students who are learning and teaching on LearnLoop.
                            </p>
                            {!userId && (
                                <Link
                                    href="/sign-up"
                                    className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
                                >
                                    Get Started Now
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
                        Our Impact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="text-2xl font-bold text-purple-600 mb-3">
                                Educational Impact
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li>✓ Collaborative learning experiences</li>
                                <li>✓ Peer mentorship at scale</li>
                                <li>✓ Reduces tutoring dependency</li>
                                <li>✓ Affordable quality education</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="text-2xl font-bold text-purple-600 mb-3">
                                Social Impact
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li>✓ Builds stronger communities</li>
                                <li>✓ Rewards knowledge sharing</li>
                                <li>✓ Develops leadership skills</li>
                                <li>✓ Creates equal opportunities</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Transform Your Learning Journey
                    </h2>
                    <p className="text-xl text-purple-100 mb-8">
                        Be part of a community where knowledge is currency and growth is mutual.
                    </p>
                    {!userId && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/sign-up"
                                className="px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition-colors"
                            >
                                Start Learning
                            </Link>
                            <Link
                                href="/sign-in"
                                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 font-bold text-lg transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h4 className="text-white font-bold mb-4">LearnLoop</h4>
                            <p className="text-sm">
                                Where knowledge becomes currency and learning becomes collaborative.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Security
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        About
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Terms of Service
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center">
                        <p className="text-sm">
                            © 2024 LearnLoop. All rights reserved. Learn. Teach. Grow Together.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
