import { auth } from '@clerk/nextjs/server';
import connectDb from '@/lib/connectDb';
import Users from '@/models/user.model';
import HelpRequest from '@/models/helpRequest.model';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDb();

    const { helpRequestId } = await req.json();

    if (!helpRequestId) {
      return NextResponse.json(
        { error: 'Help request ID is required' },
        { status: 400 }
      );
    }

    // Get tutor from database
    const tutor = await Users.findOne({ clerkId: userId });
    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      );
    }

    // Get help request
    const helpRequest = await HelpRequest.findById(helpRequestId);
    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      );
    }

    // Check if help request is still open
    if (helpRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'Help request is no longer available' },
        { status: 400 }
      );
    }

    // Create new session
    const session = await Sessions.create({
      tutor: tutor._id,
      student: helpRequest.student,
      request: helpRequestId,
      status: 'scheduled',
      startTime: new Date(),
      sessionType: 'video',
    });

    // Update help request status to "ongoing"
    await HelpRequest.findByIdAndUpdate(
      helpRequestId,
      { status: 'ongoing' },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        session: {
          _id: session._id,
          tutorId: session.tutor,
          studentId: session.student,
          requestId: session.request,
          status: session.status,
          createdAt: session.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error accepting help request:', error);
    return NextResponse.json(
      { error: 'Failed to accept help request' },
      { status: 500 }
    );
  }
}
