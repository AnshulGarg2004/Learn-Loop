import connectDb from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import HelpRequest from '@/models/helpRequest.model';
import User from '@/models/user.model';
import CreditTransactions from '@/models/credit.model';
import Badges from '@/models/badge.model';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;
    
    // 1. Find the session and populate tutor/student
    const session = await Sessions.findById(id).populate('request');
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ message: 'Session already completed' });
    }

    // 2. Get credits offered from help request
    const creditsToTransfer = session.request?.creditsOffered || 10;

    // 3. Update session status
    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // 4. Also update the associated help request if it exists
    if (session.request) {
      await HelpRequest.findByIdAndUpdate(session.request._id, { status: 'completed' });
    }

    // 5. Transfer Credits
    // Deduct from student
    await User.findByIdAndUpdate(session.student, {
      $inc: { knowledgeCredits: -creditsToTransfer }
    });

    // Add to tutor, increase reputation, and check for badges
    const tutor = await User.findById(session.tutor);
    if (tutor) {
      tutor.knowledgeCredits += creditsToTransfer;
      tutor.reputationPoints += 5;
      
      // Award "First Session" badge if not already earned
      const firstSessionBadge = await Badges.findOne({ name: 'First Session' });
      if (firstSessionBadge && !tutor.badges.includes(firstSessionBadge._id)) {
        tutor.badges.push(firstSessionBadge._id);
      }
      
      await tutor.save();
    }

    // 6. Record Transaction
    await CreditTransactions.create({
      sender: session.student,
      receiver: session.tutor,
      session: session._id,
      amount: creditsToTransfer,
      transactionType: 'session_payment'
    });

    return NextResponse.json({
      success: true,
      message: 'Session completed and credits transferred',
      session
    });
  } catch (error: any) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session: ' + error.message },
      { status: 500 }
    );
  }
}
