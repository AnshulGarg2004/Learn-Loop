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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors text-zinc-500"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">Leaderboard</h1>
            <p className="text-xs font-medium text-zinc-500">Top Knowledge Contributors</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 hidden sm:block">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-zinc-500">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-5">User</div>
                <div className="col-span-3 text-right">Reputation</div>
                <div className="col-span-3 text-right">Credits</div>
              </div>
            </div>
            <div className="divide-y divide-zinc-200">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
                  className={`grid grid-cols-1 sm:grid-cols-12 gap-4 sm:items-center px-6 py-4 transition-colors hover:bg-zinc-50 ${entry.rank <= 3 ? 'bg-zinc-50/50' : ''}`}
                >
                  <div className="sm:col-span-1 flex items-center gap-2 sm:justify-center font-medium text-zinc-500 text-sm">
                    <span className="sm:hidden text-xs text-zinc-400">Rank</span>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </div>
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-semibold text-xs shrink-0">
                      {entry.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm truncate">{entry.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {entry.badges.slice(0, 2).map((b, i) => (
                          <span key={i} className="text-[10px]" title={b.name}>{b.icon}</span>
                        ))}
                        {entry.teachingStreak > 0 && (
                          <span className="text-[10px] font-medium text-zinc-500">🔥 {entry.teachingStreak} streak</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-3 flex justify-between sm:block sm:text-right">
                    <span className="sm:hidden text-xs text-zinc-400 font-medium">Reputation</span>
                    <p className="text-sm font-semibold text-zinc-900">{entry.reputationPoints} <span className="text-xs text-zinc-500 font-medium">pts</span></p>
                  </div>
                  <div className="sm:col-span-3 flex justify-between sm:block sm:text-right">
                    <span className="sm:hidden text-xs text-zinc-400 font-medium">Credits</span>
                    <p className="text-sm font-medium text-zinc-900">{entry.knowledgeCredits}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
