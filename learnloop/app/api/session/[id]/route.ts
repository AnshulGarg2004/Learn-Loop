
import { ConnectDB } from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ConnectDB();

    const { id } = await params;
    const sessionId = id;

    // Fetch session with populated references
    const session = await Sessions.findById(sessionId)
      .populate('tutor', 'name')
      .populate('student', 'name')
      .populate({
        path: 'request',
        populate: [
          { path: 'subject' },
          { path: 'topic' },
        ],
      });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        _id: session._id,
        tutor: {
          _id: session.tutor._id,
          name: session.tutor.name || 'Unknown Tutor',
        },
        student: {
          _id: session.student._id,
          name: session.student.name || 'Unknown Student',
        },
        subject: session.request?.subject?.name || 'Subject',
        topic: session.request?.topic?.name || 'Topic',
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionType: session.sessionType,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
