# GenAI Integration Guide

This document describes the integrated GenAI features in LearnLoop.

## Features

### 1. **Doubt Classifier** (Urgency, Difficulty, Subject)
- **Endpoint:** `POST /api/ai/analyze-doubt`
- **Purpose:** Analyzes student doubts and extracts metadata
- **Input:** `{ doubtText: string }`
- **Output:**
  ```json
  {
    "title": "string",
    "subject": "string",
    "topic": "string",
    "difficulty": "beginner|intermediate|advanced",
    "urgency": "low|medium|high",
    "tags": ["string"],
    "keyPoints": ["string"],
    "followUpQuestions": ["string"],
    "learningIntent": "string"
  }
  ```
- **Integration:** Automatically called when creating help requests to classify doubts

### 2. **AI Mentor Chatbot**
- **Endpoint:** `POST /api/ai/chat` (request/response)
- **Streaming:** `POST /api/ai/chat/stream` (Server-Sent Events)
- **Purpose:** Provides real-time tutoring assistance
- **Input:** `{ message: string, conversationId?: string }`
- **Output:**
  ```json
  {
    "conversationId": "string",
    "userMessage": "string",
    "mentorResponse": "string",
    "timestamp": "ISO-8601"
  }
  ```
- **Integration:** Available as a tab in tutoring sessions (alongside tutor chat)

### 3. **Quiz Generator**
- **Endpoint:** `POST /api/ai/generate-quiz`
- **Purpose:** Generates practice quizzes on any topic
- **Input:**
  ```json
  {
    "topic": "string",
    "difficulty": "easy|medium|hard",
    "numberOfQuestions": "number"
  }
  ```
- **Output:**
  ```json
  {
    "questions": [
      {
        "id": 1,
        "question": "string",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": 0,
        "explanation": "string",
        "difficulty": "easy|medium|hard"
      }
    ],
    "topic": "string",
    "totalQuestions": 5
  }
  ```

### 4. **Summary Generator**
- **Endpoint:** `POST /api/ai/generate-summary`
- **Purpose:** Creates multi-format summaries from session transcripts
- **Input:** `{ transcript: string }`
- **Output:**
  ```json
  {
    "conciseSummary": "string",
    "bulletNotes": ["string"],
    "importantConcepts": ["string"],
    "formulas": ["string"],
    "revisionTips": ["string"],
    "homeworkSuggestions": ["string"],
    "keyTakeaway": "string"
  }
  ```

## Environment Setup

### Required Environment Variables

Add these to `.env.local` in the `learnloop` folder:

```bash
# Groq API Key (required for all GenAI features)
GROQ_API_KEY=your_groq_api_key_here

# Optional: External backend (if still using proxy)
GENAI_BACKEND_URL=http://localhost:5000
GENAI_ENDPOINT=http://localhost:5000/complete
GENAI_API_KEY=your_api_key_here
```

### Getting a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Create an API key
4. Copy the key to `.env.local` as `GROQ_API_KEY`

### Dependencies

Install required packages:

```bash
cd learnloop
npm install
```

This will install:
- `@langchain/groq` - Groq LLM integration
- `langchain` - LangChain framework
- `@langchain/core` - Core LangChain utilities
- `zod` - Schema validation

## Usage Examples

### Analyze a Doubt (Server-side)

```typescript
import { analyzeDoubt } from '@/lib/genai/services/doubtAnalyzer';

const analysis = await analyzeDoubt("What is photosynthesis?");
console.log(analysis.urgency); // "high", "medium", or "low"
console.log(analysis.difficulty); // "beginner", "intermediate", or "advanced"
```

### Generate a Quiz (Client-side)

```typescript
'use client';
import { useQuizGenerator } from '@/lib/useGenAIHooks';

export default function QuizPage() {
  const { generate, loading } = useQuizGenerator({
    onSuccess: (data) => console.log('Quiz:', data),
  });

  return (
    <button onClick={() => generate('Photosynthesis', 'intermediate', 5)} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Quiz'}
    </button>
  );
}
```

### Get Summary After Session

```typescript
import { generateSummary } from '@/lib/genai/services/summaryGenerator';

const summary = await generateSummary(`
  Student asked: What is photosynthesis?
  Tutor explained: Photosynthesis is the process...
  Key points covered: Light reactions, Dark reactions
`);

console.log(summary.keyTakeaway);
console.log(summary.homeworkSuggestions);
```

### Chat with AI Mentor (Client-side)

```typescript
'use client';
import { useMentorChat } from '@/lib/useGenAIHooks';
import { useState } from 'react';

export default function ChatPage() {
  const { sendMessage, loading } = useMentorChat();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState('');

  const handleSend = async (message: string) => {
    const response = await sendMessage(message, conversationId);
    setConversationId(response.conversationId);
    setMessages([...messages, { role: 'user', text: message }, { role: 'assistant', text: response.mentorResponse }]);
  };

  return (
    // Chat UI...
  );
}
```

## Integration Points

### 1. Help Request Flow (Ask for Help)
- When a student submits a doubt via `/ask-for-help`, the system:
  1. Calls `/api/ai/analyze-doubt` to classify the doubt
  2. Extracts urgency, difficulty, subject, topic
  3. Uses these to match with suitable tutors

### 2. Tutoring Session (Session Page)
- During a session, students can:
  - Chat with the tutor (existing feature)
  - Chat with AI Mentor in a separate tab
  - Get real-time support from AI while waiting for tutor response

### 3. Post-Session Summary
- After a tutoring session ends, generate a summary:
  ```typescript
  const sessionTranscript = messages.map(m => `${m.senderName}: ${m.message}`).join('\n');
  const summary = await generateSummary(sessionTranscript);
  // Save summary to database and notify student
  ```

## File Structure

```
learnloop/
├── lib/genai/
│   ├── groq.ts                    # Groq model initialization
│   ├── prompts.ts                 # Prompt templates
│   └── services/
│       ├── doubtAnalyzer.ts       # Doubt classification service
│       ├── quizGenerator.ts       # Quiz generation service
│       ├── summaryGenerator.ts    # Summary generation service
│       └── mentorChat.ts          # AI mentor chat service
├── app/api/ai/
│   ├── analyze-doubt/route.ts     # POST /api/ai/analyze-doubt
│   ├── chat/route.ts              # POST /api/ai/chat
│   ├── chat/stream/route.ts       # POST /api/ai/chat/stream (SSE)
│   ├── generate-quiz/route.ts     # POST /api/ai/generate-quiz
│   └── generate-summary/route.ts  # POST /api/ai/generate-summary
├── app/session/[id]/page.tsx      # Session page with AI mentor tab
├── app/ask-for-help/page.tsx      # Help request form with doubt classification
└── lib/useGenAIHooks.ts           # Client-side hooks
```

## Troubleshooting

### "GROQ_API_KEY is not set" Error
- Ensure `.env.local` contains `GROQ_API_KEY=your_key`
- Restart the Next.js dev server after updating env vars

### Chat/Quiz Generation is Slow
- Groq free tier has rate limits. Wait a few seconds between requests.
- Consider upgrading to Groq's paid tier for production.

### AI Mentor Returns Empty or Generic Responses
- Check that the prompt in `lib/genai/prompts.ts` is appropriate for your use case.
- The system uses Mixtral model; longer, more specific prompts work best.

### Streaming Chat Not Working
- Ensure `app/api/ai/chat/stream/route.ts` uses `runtime: 'nodejs'`.
- Edge runtime does not support streaming via ReadableStream.

## Future Enhancements

- [ ] Store conversation history in MongoDB
- [ ] Add tutor rating based on session quality
- [ ] Implement flashcard generation from notes
- [ ] Add learning path generation
- [ ] Integrate with video recording for better session summaries
- [ ] Multi-language support for students worldwide

## Support

For issues or feature requests, check:
1. Groq API status: [status.groq.com](https://status.groq.com)
2. LangChain docs: [python.langchain.com](https://python.langchain.com)
3. LearnLoop issues: GitHub repository
