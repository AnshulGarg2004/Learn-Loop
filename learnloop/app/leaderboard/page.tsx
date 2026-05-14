'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  rank: number;
  name: string;
  reputationPoints: number;
  knowledgeCredits: number;
  teachingStreak: number;
  badges: { name: string; icon: string }[];
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string; icon: string }> = {
  1: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: '🥇' },
  2: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: '🥈' },
  3: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: '🥉' },
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Campus Leaderboard</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Knowledge Contributors</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* 2nd Place */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-[2rem] border-2 border-slate-200 p-6 text-center shadow-sm"
                >
                  <div className="text-4xl mb-3">🥈</div>
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-700 text-xl font-black mx-auto mb-3">
                    {top3[1].name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <p className="font-black text-slate-900 text-sm truncate">{top3[1].name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">⭐ {top3[1].reputationPoints} pts</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {top3[1].badges.map((b, i) => <span key={i} className="text-lg">{b.icon}</span>)}
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-linear-to-br from-amber-500 to-orange-500 rounded-[2rem] p-6 text-center shadow-2xl shadow-amber-100 scale-105 text-white"
                >
                  <div className="text-5xl mb-3">🥇</div>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
                    {top3[0].name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <p className="font-black text-lg truncate">{top3[0].name}</p>
                  <p className="text-sm font-bold text-white/80 mt-1">⭐ {top3[0].reputationPoints} pts</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {top3[0].badges.map((b, i) => <span key={i} className="text-xl">{b.icon}</span>)}
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-[2rem] border-2 border-orange-100 p-6 text-center shadow-sm"
                >
                  <div className="text-4xl mb-3">🥉</div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 text-xl font-black mx-auto mb-3">
                    {top3[2].name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <p className="font-black text-slate-900 text-sm truncate">{top3[2].name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">⭐ {top3[2].reputationPoints} pts</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {top3[2].badges.map((b, i) => <span key={i} className="text-lg">{b.icon}</span>)}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Remaining Rankings */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Full Rankings</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {rest.map((entry, index) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-5 p-5 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-black text-slate-400 w-6 text-center">#{entry.rank}</span>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm">
                      {entry.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{entry.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entry.badges.slice(0, 2).map((b, i) => (
                          <span key={i} className="text-xs">{b.icon}</span>
                        ))}
                        {entry.teachingStreak > 0 && (
                          <span className="text-[10px] font-bold text-orange-500">🔥 {entry.teachingStreak}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-600">⭐ {entry.reputationPoints}</p>
                      <p className="text-[10px] font-bold text-slate-400">💎 {entry.knowledgeCredits} credits</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
