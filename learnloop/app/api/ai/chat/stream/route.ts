import { NextResponse } from 'next/server';
import { streamMessage } from '@/lib/genai/services/mentorChat';

export const runtime = 'nodejs';

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

    // Create a readable stream for SSE
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamMessage(conversationId, message)) {
            controller.enqueue(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
          controller.enqueue(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`);
          controller.close();
        } catch (error: any) {
          controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Stream chat setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Stream chat setup failed' },
      { status: 500 }
    );
  }
}
