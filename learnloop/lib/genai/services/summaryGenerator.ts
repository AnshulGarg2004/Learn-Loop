import { initializeGroqModel } from '../groq';
import { createSummaryPrompt } from '../prompts';

export interface SessionSummary {
  conciseSummary: string;
  bulletNotes: string[];
  importantConcepts: string[];
  formulas: string[];
  revisionTips: string[];
  homeworkSuggestions: string[];
  keyTakeaway: string;
}

export async function generateSummary(transcript: string): Promise<SessionSummary> {
  try {
    if (!transcript || transcript.trim().length === 0) {
      return {
        conciseSummary: "No chat history was recorded for this session. This often happens in video-only sessions.",
        bulletNotes: ["No chat messages found"],
        importantConcepts: [],
        formulas: [],
        revisionTips: ["Try using the chat feature next time to get AI-generated insights!"],
        homeworkSuggestions: [],
        keyTakeaway: "Direct video/audio interaction only."
      };
    }

    const model = initializeGroqModel();
    const prompt = createSummaryPrompt();

    // Create the chain
    const chain = prompt.pipe(model);

    // Invoke with input
    const response = await chain.invoke({ transcript });

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
      throw new Error('Could not parse summary response as JSON');
    }

    let jsonString = jsonMatch[0];
    
    // Clean up common JSON errors from LLMs (unescaped newlines in strings)
    jsonString = jsonString.replace(/\n/g, ' '); 

    try {
      const result = JSON.parse(jsonString);
      return {
        conciseSummary: result.conciseSummary || '',
        bulletNotes: result.bulletNotes || [],
        importantConcepts: result.importantConcepts || [],
        formulas: result.formulas || [],
        revisionTips: result.revisionTips || [],
        homeworkSuggestions: result.homeworkSuggestions || [],
        keyTakeaway: result.keyTakeaway || '',
      };
    } catch (parseError) {
      console.error('JSON Parse Error. Content was:', jsonString);
      throw new Error(`Failed to parse AI response: ${(parseError as any).message}`);
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    throw new Error(`Summary generation failed: ${(error as any).message}`);
  }
}
