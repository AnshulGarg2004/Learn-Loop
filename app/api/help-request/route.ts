import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/connectDb";
import User from "@/models/user.model";
import HelpRequest from "@/models/helpRequest.model";
import Subject from "@/models/subject.model";
import Topic from "@/models/topic.model";

export async function POST(req: NextRequest) {
    try {
        await ConnectDB();

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const dbUser = await User.findOneAndUpdate(
            { clerkId: userId },
            { clerkId: userId },
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
        if (!title || !description || !subject || !urgencyLevel) {
            return NextResponse.json(
                {
                    error: "Missing required fields: title, description, subject, urgencyLevel",
                },
                { status: 400 }
            );
        }

        // Verify subject exists
        const subjectDoc = await Subject.findById(subject);
        if (!subjectDoc) {
            return NextResponse.json(
                { error: "Invalid subject selected" },
                { status: 400 }
            );
        }

        // Verify topic if provided
        if (topic) {
            const topicDoc = await Topic.findById(topic);
            if (!topicDoc) {
                return NextResponse.json(
                    { error: "Invalid topic selected" },
                    { status: 400 }
                );
            }
        }

        // Create help request
        const helpRequest = await HelpRequest.create({
            student: dbUser._id,
            subject,
            topic: topic || null,
            title,
            description,
            preferredLanguage: preferredLanguage || "English",
            urgencyLevel,
            creditsOffered: creditsOffered || 10,
            sessionDuration: sessionDuration || 60,
            status: "open",
        });

        return NextResponse.json(
            { success: true, helpRequest, message: "Help request posted successfully" },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Help request error:", error);
        return NextResponse.json(
            { error: "Failed to create help request" },
            { status: 500 }
        );
    }
}
