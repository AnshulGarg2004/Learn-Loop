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
    
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    // Push all new messages into the aiMessages array
    await Sessions.findByIdAndUpdate(sessionId, {
      $push: { aiMessages: { $each: messages } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving AI messages:', error);
    return NextResponse.json({ error: 'Failed to save AI messages' }, { status: 500 });
  }
}
