import { NextResponse } from 'next/server';
import connectDb from '@/lib/connectDb';
import Users from '@/models/user.model';
import Badges from '@/models/badge.model';

export async function GET() {
  try {
    await connectDb();

    const topUsers = await Users.find({})
      .sort({ reputationPoints: -1, knowledgeCredits: -1 })
      .limit(20)
      .lean();

    const allBadges = await Badges.find({}).lean();
    const badgeMap = new Map(allBadges.map((b: any) => [String(b._id), b]));

    const leaderboard = topUsers.map((user: any, index: number) => ({
      rank: index + 1,
      name: user.name || 'Anonymous',
      reputationPoints: user.reputationPoints || 0,
      knowledgeCredits: user.knowledgeCredits || 0,
      teachingStreak: user.teachingStreak || 0,
      badges: (user.badges || []).map((id: any) => {
        const badge = badgeMap.get(String(id));
        return badge ? { name: badge.name, icon: badge.iconUrl } : null;
      }).filter(Boolean).slice(0, 3), // Show top 3 badges
    }));

    return NextResponse.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
