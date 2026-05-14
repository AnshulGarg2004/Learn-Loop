import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import User from "@/models/user.model";
import HelpRequest from "@/models/helpRequest.model";
import Subject from "@/models/subject.model";
import Topic from "@/models/topic.model";

export async function POST(req: NextRequest) {
    try {
        await connectDb();

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const clerkUser = await currentUser();
        const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || 
                     clerkUser?.username || 
                     clerkUser?.emailAddresses?.[0]?.emailAddress || 
                     "LearnLoop user";
        const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

        const dbUser = await User.findOneAndUpdate(
            { clerkId: userId },
            { clerkId: userId, name, email },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const body = await req.json();
        const {
            title,
            description,
            subject,
            topic,
            urgencyLevel,
            preferredLanguage,
            creditsOffered,
            sessionDuration,
        } = body;

        // Validate required fields
        if (!title || !description || !urgencyLevel) {
            return NextResponse.json(
                {
                    error: "Missing required fields: title, description, urgencyLevel",
                },
                { status: 400 }
            );
        }

        // Verify or create subject
        let subjectId = null;
        if (subject) {
            let subjectDoc = null;
            if (subject.match(/^[0-9a-fA-F]{24}$/)) {
                subjectDoc = await Subject.findById(subject);
            } else {
                subjectDoc = await Subject.findOne({ name: subject });
                if (!subjectDoc) {
                    subjectDoc = await Subject.create({ name: subject });
                }
            }
            subjectId = subjectDoc?._id;
        }

        // Verify or create topic
        let topicId = null;
        if (topic) {
            let topicDoc = null;
            if (topic.match(/^[0-9a-fA-F]{24}$/)) {
                topicDoc = await Topic.findById(topic);
            } else {
                topicDoc = await Topic.findOne({ name: topic, subject: subjectId });
                if (!topicDoc) {
                    topicDoc = await Topic.create({ name: topic, subject: subjectId });
                }
            }
            topicId = topicDoc?._id;
        }

        // ── ESCROW: Check and deduct credits at posting time ──
        const credits = creditsOffered || 10;
        if (dbUser.knowledgeCredits < credits) {
            return NextResponse.json(
                { error: `Insufficient credits. You have ${dbUser.knowledgeCredits} but need ${credits} to post this request.` },
                { status: 400 }
            );
        }

        // Deduct credits immediately (escrow)
        await User.findByIdAndUpdate(dbUser._id, {
            $inc: { knowledgeCredits: -credits }
        });

        // Create help request
        const helpRequest = await HelpRequest.create({
            student: dbUser._id,
            subject: subjectId,
            topic: topicId,
            title,
            description,
            preferredLanguage: preferredLanguage || "English",
            urgencyLevel,
            creditsOffered: credits,
            sessionDuration: sessionDuration || 60,
            status: "open",
        });

        return NextResponse.json(
            { success: true, helpRequest, message: "Help request posted successfully" },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Help request error details:", {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            error: error,
        });
        return NextResponse.json(
            { error: `Failed to create help request: ${error?.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
