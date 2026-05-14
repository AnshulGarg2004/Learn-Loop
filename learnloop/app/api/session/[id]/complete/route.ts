import { auth } from '@clerk/nextjs/server';
import connectDb from '@/lib/connectDb';
import Users from '@/models/user.model';
import HelpRequest from '@/models/helpRequest.model';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: sessionId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, feedback } = await req.json();

    await connectDb();

    // Get session
    const session = await Sessions.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Get help request to find bounty amount
    const helpRequest = await HelpRequest.findById(session.request);
    const bounty = helpRequest?.creditsOffered || 10;

    // 1. Mark session as completed
    session.status = 'completed';
    session.endTime = new Date();
    session.sessionSummary = feedback;
    session.rating = rating;
    await session.save();

    // 2. Mark help request as completed
    if (helpRequest) {
      helpRequest.status = 'completed';
      await helpRequest.save();
    }

    // 3. Reward tutor
    const tutorId = session.tutor;
    console.log(`[REWARD] Attempting to reward tutor: ${tutorId} with bounty: ${bounty}`);
    
    const tutor = await Users.findById(tutorId);
    if (tutor) {
      // Reputation points: rating * 2
      const reputationGain = (Number(rating) || 5) * 2;
      
      const updateResult = await Users.findByIdAndUpdate(tutor._id, {
        $inc: { 
          knowledgeCredits: Number(bounty),
          reputationPoints: reputationGain
        }
      }, { new: true });
      
      console.log(`[REWARD] Successfully updated tutor. New balance: ${updateResult?.knowledgeCredits}, New Rep: ${updateResult?.reputationPoints}`);
    } else {
      console.error(`[REWARD] Tutor not found in database: ${tutorId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Session completed and rewards distributed'
    });

  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}
