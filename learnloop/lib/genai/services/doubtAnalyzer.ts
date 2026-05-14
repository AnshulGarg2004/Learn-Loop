import { initializeGroqModel } from '../groq';
import { createDoubtAnalysisPrompt } from '../prompts';

export interface DoubtAnalysis {
  title: string;
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  urgency: 'low' | 'medium' | 'high';
  tags: string[];
  keyPoints: string[];
  followUpQuestions: string[];
  learningIntent: string;
}

export async function analyzeDoubt(doubtText: string): Promise<DoubtAnalysis> {
  try {
    if (!doubtText || doubtText.trim().length === 0) {
      throw new Error('Doubt text cannot be empty');
    }

    const model = initializeGroqModel();
    const prompt = createDoubtAnalysisPrompt();

    // Create the chain
    const chain = prompt.pipe(model);

    // Invoke with input
    const response = await chain.invoke({ doubt: doubtText });

    // Extract text from response
    let textContent = '';
    if (typeof response === 'string') {
      textContent = response;
    } else if (response && typeof response === 'object') {
      if ('content' in response) {
        textContent = (response as any).content;
      } else if ('text' in response) {
        textContent = (response as any).text;
      } else {
        textContent = JSON.stringify(response);
      }
    }

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse analysis response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      title: result.title || '',
      subject: result.subject || '',
      topic: result.topic || '',
      difficulty: result.difficulty || 'intermediate',
      urgency: result.urgency || 'medium',
      tags: result.tags || [],
      keyPoints: result.keyPoints || [],
      followUpQuestions: result.followUpQuestions || [],
      learningIntent: result.learningIntent || '',
    };
  } catch (error) {
    console.error('Doubt analysis error:', error);
    throw new Error(`Doubt analysis failed: ${(error as any).message}`);
  }
}
