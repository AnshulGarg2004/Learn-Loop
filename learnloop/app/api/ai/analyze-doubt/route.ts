import { NextResponse } from 'next/server';
import { analyzeDoubt } from '@/lib/genai/services/doubtAnalyzer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doubtText } = body;

    if (!doubtText || typeof doubtText !== 'string') {
      return NextResponse.json(
        { error: 'doubtText is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await analyzeDoubt(doubtText);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Analyze doubt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze doubt' },
      { status: 500 }
    );
  }
}
