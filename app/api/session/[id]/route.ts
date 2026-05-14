
import { ConnectDB } from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ConnectDB();

    const sessionId = params.id;

    // Fetch session with populated references
    const session = await Sessions.findById(sessionId)
      .populate('tutor', 'firstName lastName')
      .populate('student', 'firstName lastName')
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
          name: `${session.tutor.firstName || ''} ${session.tutor.lastName || ''}`,
        },
        student: {
          _id: session.student._id,
          name: `${session.student.firstName || ''} ${session.student.lastName || ''}`,
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
