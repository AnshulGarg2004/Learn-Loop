import Users from '@/models/user.model';
import Badges from '@/models/badge.model';
import mongoose from 'mongoose';

export const DEFAULT_BADGES = [
  {
    name: "Pioneer",
    description: "Completed your very first tutoring session!",
    iconUrl: "🚀"
  },
  {
    name: "Excellence",
    description: "Received a perfect 5-star rating from a student.",
    iconUrl: "⭐"
  },
  {
    name: "Streak Master",
    description: "Completed 5 tutoring sessions in the community.",
    iconUrl: "🔥"
  },
  {
    name: "Knowledge Mogul",
    description: "Earned over 200 Knowledge Credits by teaching.",
    iconUrl: "💰"
  }
];

/**
 * Ensures default badges exist in the database and returns them.
 */
export async function seedBadges() {
  const existingCount = await Badges.countDocuments();
  if (existingCount === 0) {
    await Badges.insertMany(DEFAULT_BADGES);
  }
  return await Badges.find({});
}

/**
 * Checks if a user qualifies for any new badges and awards them.
 * @param userId The database _id of the user
 * @param currentRating The rating from the session just completed
 */
export async function checkAndAwardBadges(userId: string, currentRating?: number) {
  const user = await Users.findById(userId);
  if (!user) return [];

  const allBadges = await seedBadges();
  const awardedBadgeIds = (user.badges || []).map((b: any) => b.toString());
  const newBadges: any[] = [];

  // Logic for each badge
  const badgeMap: Record<string, any> = {};
  allBadges.forEach(b => badgeMap[b.name] = b);

  // 1. Pioneer Badge (First Session)
  if (!awardedBadgeIds.includes(badgeMap["Pioneer"]?._id.toString())) {
    newBadges.push(badgeMap["Pioneer"]?._id);
  }

  // 2. Excellence Badge (Perfect Rating)
  if (currentRating === 5 && !awardedBadgeIds.includes(badgeMap["Excellence"]?._id.toString())) {
    newBadges.push(badgeMap["Excellence"]?._id);
  }
  // 3. Streak Master
  const sessionCount = await mongoose.model('Sessions').countDocuments({ tutor: userId, status: 'completed' });
  if (sessionCount >= 5 && !awardedBadgeIds.includes(badgeMap["Streak Master"]?._id.toString())) {
    newBadges.push(badgeMap["Streak Master"]?._id);
  }

  // 4. Knowledge Mogul
  if (user.knowledgeCredits >= 200 && !awardedBadgeIds.includes(badgeMap["Knowledge Mogul"]?._id.toString())) {
    newBadges.push(badgeMap["Knowledge Mogul"]?._id);
  }

  if (newBadges.length > 0) {
    await Users.findByIdAndUpdate(userId, {
      $addToSet: { badges: { $each: newBadges } }
    });
  }

  return newBadges;
}
