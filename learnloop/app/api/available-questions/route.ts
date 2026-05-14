import connectDb from '@/lib/connectDb';
import HelpRequest from '@/models/helpRequest.model';
import Subject from '@/models/subject.model';
import Topic from '@/models/topic.model';
import Users from '@/models/user.model';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rankRequests } from '@/lib/genai/services/matchmaker';

export async function GET(req: Request) {
  try {
    await connectDb();

    // Get all open help requests
    const helpRequests = await HelpRequest.find({ status: 'open' })
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('student', 'name')
      .sort({ createdAt: -1 });

    // Transform data for response
    let questions: any[] = helpRequests.map((request: any) => ({
      _id: request._id,
      title: request.title,
      description: request.description,
      subject: request.subject?.name || 'Unknown',
      topic: request.topic?.name || 'Unknown',
      student: {
        name: request.student?.name || 'Unknown Student',
      },
      urgencyLevel: request.urgencyLevel,
      creditsOffered: request.creditsOffered,
      createdAt: new Date(request.createdAt).toLocaleDateString(),
      applicationsCount: request.applications?.length || 0,
    }));

    // AI RANKING (Agent Logic)
    try {
      const { userId } = await auth();
      console.log('[MATCHMAKER] userId:', userId);
      if (userId) {
        const dbUser = await Users.findOne({ clerkId: userId });
        console.log('[MATCHMAKER] expertise count:', dbUser?.expertise?.length ?? 0);
        if (dbUser && dbUser.expertise?.length > 0) {
          console.log('[MATCHMAKER] calling rankRequests with', questions.length, 'questions');
          const matchScores = await rankRequests(dbUser.expertise, questions);
          console.log('[MATCHMAKER] scores returned:', matchScores.length, JSON.stringify(matchScores));
          
          // Map scores back to questions
          questions = questions.map(q => {
            const match = matchScores.find(m => m.requestId === q._id.toString());
            return {
              ...q,
              matchScore: match ? match.score : 0,
              matchReason: match ? match.reason : ''
            };
          });

          // Sort by match score (highest first)
          questions.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        } else {
          console.log('[MATCHMAKER] skipped — no expertise found for user');
        }
      } else {
        console.log('[MATCHMAKER] skipped — user not authenticated');
      }
    } catch (aiError) {
      console.error('[MATCHMAKER] AI Matching Error (falling back to default sort):', aiError);
    }

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching available questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
