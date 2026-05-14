import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/connectDb";
import Subject from "@/models/subject.model";
import Topic from "@/models/topic.model";

export async function GET(req: Request) {
    try {
        await ConnectDB();

        const { searchParams } = new URL(req.url);
        const subjectId = searchParams.get("subjectId");

        if (subjectId) {
            // Fetch topics for a specific subject
            const topics = await Topic.find({ subject: subjectId }).select("_id name");
            return NextResponse.json({ topics }, { status: 200 });
        } else {
            // Fetch all subjects
            const subjects = await Subject.find({}).select("_id name");
            return NextResponse.json({ subjects }, { status: 200 });
        }
    } catch (error: any) {
        console.error("Error fetching subjects/topics:", error);
        return NextResponse.json(
            { error: "Failed to fetch subjects/topics" },
            { status: 500 }
        );
    }
}
