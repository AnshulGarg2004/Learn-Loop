import { initializeGroqModel } from '../groq';
import { PromptTemplate } from '@langchain/core/prompts';

export interface MatchScore {
  requestId: string;
  score: number;
  reason: string;
}

const MATCHMAKER_PROMPT = `
You are the "LearnLoop Matchmaker Agent". Your job is to rank student help requests for a tutor based on their expertise.

TUTOR EXPERTISE:
{expertise}

OPEN HELP REQUESTS (JSON):
{requests}

INSTRUCTIONS:
1. Compare each request's subject and title with the tutor's expertise.
2. Assign a match score from 0 to 100.
   - 100: Perfect match (e.g., Tutor knows "React", Request is "Help with React hooks").
   - 70-90: Good match (e.g., Tutor knows "Computer Science", Request is "Data Structures").
   - 40-60: Related match (e.g., Tutor knows "Math", Request is "Physics problem involving Calculus").
   - 0-30: Poor match.
3. Provide a very short 1-sentence reason for the score.
4. Return ONLY a valid JSON array. No markdown, no explanation. Each object MUST have exactly these three keys: "requestId", "score", "reason".

Example output:
[{"requestId": "abc123", "score": 85, "reason": "Direct match on React expertise."}]
`;

export async function rankRequests(tutorExpertise: any[], requests: any[]): Promise<MatchScore[]> {
  try {
    if (!tutorExpertise || tutorExpertise.length === 0 || !requests || requests.length === 0) {
      return [];
    }

    const model = initializeGroqModel();
    const prompt = PromptTemplate.fromTemplate(MATCHMAKER_PROMPT);

    const expertiseStr = tutorExpertise
      .map(e => `${e.subject} (${e.topic || 'General'})`)
      .join(', ');

    // Use "requestId" as the key so the AI returns the exact same key name we expect
    const requestsStr = JSON.stringify(
      requests.map(r => ({
        requestId: r._id.toString(),
        title: r.title,
        subject: r.subject,
        topic: r.topic,
      }))
    );

    const chain = prompt.pipe(model);
    const response = await chain.invoke({ expertise: expertiseStr, requests: requestsStr });

    // Extract text content
    let textContent = '';
    if (typeof response === 'string') {
      textContent = response;
    } else if (response && typeof response === 'object' && 'content' in response) {
      textContent = String((response as any).content);
    }

    // Find JSON array in response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('Matchmaker: No JSON array found in response');
      return [];
    }

    // Robust sanitization: strip control characters, fix trailing commas
    const cleanedJson = jsonMatch[0]
      .replace(/[\x00-\x1F\x7F]/g, (c) => (['\n', '\r', '\t'].includes(c) ? ' ' : ''))
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}');

    const results = JSON.parse(cleanedJson);

    return results.map((r: any) => ({
      requestId: String(r.requestId || ''),
      score: Number(r.score) || 0,
      reason: String(r.reason || ''),
    }));

  } catch (error) {
    console.error('Matchmaker Agent Error:', error);
    return []; // Graceful fallback — never crash the dashboard
  }
}
