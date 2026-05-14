import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/connectDb";
import User from "@/models/user.model";
import HelpRequest from "@/models/helpRequest.model";
import Sessions from "@/models/sesion.model";
import Subject from "@/models/subject.model";
import Topic from "@/models/topic.model";
import Badges from "@/models/badge.model";

function formatDate(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value?: Date | string | null) {
  if (!value) return "";

  const date = new Date(value).getTime();
  const diffInDays = Math.max(0, Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}

export async function GET() {
  try {
    await ConnectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();

    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { clerkId: userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const userObjectId = dbUser._id;

    const [postedRequests, answeredRequests, userSessions, badgeDocs, allSubjects, allTopics] = await Promise.all([
      HelpRequest.find({ student: userObjectId }).sort({ createdAt: -1 }).lean(),
      HelpRequest.find({ applications: { $elemMatch: { tutor: userObjectId, status: "accepted" } } })
        .sort({ createdAt: -1 })
        .lean(),
      Sessions.find({ $or: [{ student: userObjectId }, { tutor: userObjectId }] }).sort({ createdAt: -1 }).lean(),
      Badges.find({ _id: { $in: dbUser.badges ?? [] } }).lean(),
      Subject.find({}).lean(),
      Topic.find({}).lean(),
    ]);

    const subjectMap = new Map(allSubjects.map((subject) => [String(subject._id), subject.name]));
    const topicMap = new Map(allTopics.map((topic) => [String(topic._id), topic.name]));
    const badgeMap = new Map(badgeDocs.map((badge) => [String(badge._id), badge]));
    const requestIds = [...new Set(userSessions.map((session: any) => String(session.request)).filter((requestId) => requestId !== "undefined" && requestId !== "null"))];
    const requestDocs = requestIds.length > 0
      ? await HelpRequest.find({ _id: { $in: requestIds } }).lean()
      : [];
    const requestMap = new Map(requestDocs.map((request: any) => [String(request._id), request]));

    const expertise = (dbUser.expertise ?? []).map((entry: any) => ({
      subject: entry.subject ? subjectMap.get(String(entry.subject)) ?? "Unknown subject" : "Unknown subject",
      topic: entry.topic ? topicMap.get(String(entry.topic)) ?? "Unknown topic" : "",
      proficiencyLevel: entry.proficiencyLevel ?? "beginner",
      experiencePoints: entry.experiencePoints ?? 0,
      averageRating: entry.averageRating ?? 0,
      totalSessions: entry.totalSessions ?? 0,
    }));

    const postedQuestions = postedRequests.map((request: any) => ({
      _id: String(request._id),
      title: request.title,
      subject: request.subject ? subjectMap.get(String(request.subject)) ?? "Unknown subject" : "Unknown subject",
      topic: request.topic ? topicMap.get(String(request.topic)) ?? "" : "",
      status: request.status,
      urgencyLevel: request.urgencyLevel,
      createdAt: formatDate(request.createdAt),
      replies: request.applications?.length ?? 0,
      creditsOffered: request.creditsOffered ?? 10,
    }));

    const answeredQuestions = answeredRequests.map((request: any) => ({
      _id: String(request._id),
      title: request.title,
      subject: request.subject ? subjectMap.get(String(request.subject)) ?? "Unknown subject" : "Unknown subject",
      status: request.status,
      credits: request.creditsOffered ?? 0,
      date: formatRelative(request.updatedAt ?? request.createdAt),
    }));

    const sessions = {
      ongoing: userSessions
        .filter((session: any) => session.status === "ongoing")
        .map((session: any) => ({
          _id: String(session._id),
          title: requestMap.get(String(session.request))?.title ?? "Live session",
          peer: String(session.tutor) === String(userObjectId) ? "Student session" : "Tutor session",
          time: "In progress",
        })),
      scheduled: userSessions
        .filter((session: any) => session.status === "scheduled")
        .map((session: any) => ({
          _id: String(session._id),
          title: requestMap.get(String(session.request))?.title ?? "Scheduled session",
          peer: String(session.tutor) === String(userObjectId) ? "Student session" : "Tutor session",
          time: formatDate(session.startTime) || "Scheduled",
        })),
      completed: userSessions
        .filter((session: any) => session.status === "completed")
        .map((session: any) => ({
          _id: String(session._id),
          title: requestMap.get(String(session.request))?.title ?? "Completed session",
          peer: String(session.tutor) === String(userObjectId) ? "Student session" : "Tutor session",
          feedback: session.sessionSummary || "Session completed",
        })),
    };

    const transactions = [
      ...postedRequests.map((request: any) => ({
        _id: `spent-${request._id}`,
        type: "spent" as const,
        amount: `-${request.creditsOffered ?? 10}`,
        reason: `Posted: ${request.title}`,
        date: formatRelative(request.createdAt),
        timestamp: new Date(request.createdAt).getTime(),
      })),
      ...userSessions
        .filter((session: any) => session.status === "completed" && String(session.tutor) === String(userObjectId))
        .map((session: any) => ({
          _id: `earned-${session._id}`,
          type: "earned" as const,
          amount: "+10",
          reason: requestMap.get(String(session.request))?.title ?? "Completed teaching session",
          date: formatRelative(session.updatedAt ?? session.createdAt),
          timestamp: new Date(session.updatedAt ?? session.createdAt ?? Date.now()).getTime(),
        })),
    ].sort((left, right) => right.timestamp - left.timestamp)
      .map(({ timestamp, ...transaction }) => transaction);

    const profile = {
      name:
        `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
        clerkUser?.username ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        "LearnLoop user",
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || dbUser.institution?.email || "",
      imageUrl: clerkUser?.imageUrl || "",
      role: dbUser.role ?? "student",
      institution: dbUser.institution?.name ?? "",
      preferredLanguage: dbUser.preferredLanguage ?? "English",
      knowledgeCredits: dbUser.knowledgeCredits ?? 0,
      reputationPoints: dbUser.reputationPoints ?? 0,
      teachingStreak: dbUser.teachingStreak ?? 0,
      expertise,
    };

    const metrics = {
      credits: dbUser.knowledgeCredits ?? 0,
      reputation: dbUser.reputationPoints ?? 0,
      sessionsCompleted: userSessions.filter((session: any) => session.status === "completed").length,
      requestsPosted: postedRequests.length,
      answeredQuestions: answeredRequests.length,
      activeSessions: userSessions.filter((session: any) => session.status === "ongoing").length,
    };

    const badges = (dbUser.badges ?? []).map((badgeId: any) => {
      const badge = badgeMap.get(String(badgeId));
      return {
        _id: String(badgeId),
        name: badge?.name ?? "Badge",
        description: badge?.description ?? "Achievement unlocked",
        icon: badge?.iconUrl ?? "🏆",
        earned: true,
      };
    });

    return NextResponse.json(
      {
        profile,
        metrics,
        postedQuestions,
        answeredQuestions,
        sessions,
        badges,
        transactions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}