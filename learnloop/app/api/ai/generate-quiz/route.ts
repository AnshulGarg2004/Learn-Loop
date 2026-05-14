import { NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/genai/services/quizGenerator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, difficulty, numberOfQuestions } = body;

    if (!topic || !difficulty || !numberOfQuestions) {
      return NextResponse.json(
        { error: 'topic, difficulty, and numberOfQuestions are required' },
        { status: 400 }
      );
    }

    const result = await generateQuiz(topic, difficulty, parseInt(numberOfQuestions));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Generate quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
