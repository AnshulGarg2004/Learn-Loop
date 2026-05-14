import { auth } from '@clerk/nextjs/server';
import connectDb from '@/lib/connectDb';
import User from '@/models/user.model';
import Subject from '@/models/subject.model';
import Topic from '@/models/topic.model';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expertise } = await req.json(); // Array of { subject: string (name), topic?: string (name) }

    await connectDb();

    // Convert subject/topic names to their ObjectIds
    const resolvedExpertise = await Promise.all(
      expertise.map(async (entry: { subject: string; topic?: string; proficiencyLevel?: string }) => {
        // Find subject by name to get its ObjectId
        const subjectDoc = await Subject.findOne({ name: entry.subject });
        if (!subjectDoc) {
          throw new Error(`Subject not found: ${entry.subject}`);
        }

        // Find topic by name if provided
        let topicId = undefined;
        if (entry.topic) {
          const topicDoc = await Topic.findOne({ name: entry.topic, subject: subjectDoc._id });
          topicId = topicDoc?._id;
        }

        return {
          subject: subjectDoc._id,
          topic: topicId,
          proficiencyLevel: entry.proficiencyLevel || 'intermediate',
        };
      })
    );

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { expertise: resolvedExpertise },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      expertise: updatedUser.expertise
    });

  } catch (error: any) {
    console.error('Error updating expertise:', error);
    return NextResponse.json(
      { error: 'Failed to update expertise: ' + error.message },
      { status: 500 }
    );
  }
}
