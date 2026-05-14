import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/genai/services/summaryGenerator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'transcript is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await generateSummary(transcript);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Generate summary error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
