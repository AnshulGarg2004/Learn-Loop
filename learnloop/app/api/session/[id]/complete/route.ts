import { ConnectDB } from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import HelpRequest from '@/models/helpRequest.model';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ConnectDB();

    const { id } = await params;
    
    // Update session status
    const session = await Sessions.findByIdAndUpdate(
      id,
      { 
        status: 'completed',
        endTime: new Date()
      },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Also update the associated help request if it exists
    if (session.request) {
      await HelpRequest.findByIdAndUpdate(session.request, { status: 'completed' });
    }

    return NextResponse.json({
      success: true,
      message: 'Session marked as completed',
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
