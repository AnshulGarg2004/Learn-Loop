import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/genai/services/mentorChat';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { conversationId, message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate conversation ID if not provided
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const result = await sendMessage(conversationId, message);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
