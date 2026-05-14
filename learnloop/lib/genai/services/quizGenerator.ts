import { initializeDeterministicGroqModel } from '../groq';
import { createQuizPrompt } from '../prompts';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  questions: QuizQuestion[];
  topic: string;
  totalQuestions: number;
}

export async function generateQuiz(
  topic: string,
  difficulty: string,
  numberOfQuestions: number
): Promise<QuizResult> {
  try {
    if (!topic || !difficulty || numberOfQuestions < 1) {
      throw new Error('Invalid quiz parameters');
    }

    const model = initializeDeterministicGroqModel().bind({
      response_format: { type: "json_object" }
    });
    const prompt = createQuizPrompt();

    // Create the chain
    const chain = prompt.pipe(model);

    // Invoke with inputs
    const response = await chain.invoke({
      topic,
      difficulty,
      numberOfQuestions: numberOfQuestions.toString(),
    });

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

    // Clean up trailing commas that LLMs sometimes generate
    textContent = textContent.replace(/,\s*([\]}])/g, '$1');

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse quiz response as JSON');
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // If parsing still fails (e.g. unescaped quotes), throw a clear error
      console.error("JSON Parse Error on:", jsonMatch[0]);
      throw new Error("AI generated malformed JSON. Please try again.");
    }

    return {
      questions: result.questions || [],
      topic: result.topic || topic,
      totalQuestions: result.totalQuestions || numberOfQuestions,
    };
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw new Error(`Quiz generation failed: ${(error as any).message}`);
  }
}
