import connectDb from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id: sessionId } = await params;
    const body = await req.json();
    const { senderId, senderName, message, timestamp } = body;

    if (!senderId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await Sessions.findByIdAndUpdate(sessionId, {
      $push: { messages: { senderId, senderName, message, timestamp } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ error: 'Failed to save chat message' }, { status: 500 });
  }
}
