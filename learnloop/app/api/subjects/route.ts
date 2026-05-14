import { NextResponse } from "next/server";

import Subject from "@/models/subject.model";
import Topic from "@/models/topic.model";
import connectDb from "@/lib/connectDb";

export async function GET(req: Request) {
    try {
        await connectDb();

        // Auto-seed if empty
        const subjectCount = await Subject.countDocuments();
        if (subjectCount === 0) {
            console.log("Seeding subjects and topics...");
            const seedData = [
                { name: "Computer Science", topics: ["Data Structures", "Algorithms", "React", "Node.js", "Python"] },
                { name: "Mathematics", topics: ["Calculus", "Linear Algebra", "Trigonometry", "Probability"] },
                { name: "Physics", topics: ["Quantum Mechanics", "Electromagnetism", "Thermodynamics"] },
                { name: "Business", topics: ["Marketing", "Finance", "Economics"] },
                { name: "Language", topics: ["English", "Hindi", "Spanish", "French"] }
            ];

            for (const item of seedData) {
                const sub = await Subject.create({ name: item.name });
                for (const topicName of item.topics) {
                    await Topic.create({ name: topicName, subject: sub._id });
                }
            }
        }

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
            { error: "Failed to fetch subjects/topics: " + error.message },
            { status: 500 }
        );
    }
}
