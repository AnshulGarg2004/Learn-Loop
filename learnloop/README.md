# LearnLoop - AI-Powered Tutoring Platform

A modern Next.js application that connects students with tutors and provides AI-powered learning assistance.

## Features

### Core Features
- **Bright, Colorful Dashboard** - Beautiful, gradient-based UI with persistent sidebar
- **Real-time Tutoring Sessions** - Socket.io-based chat, video, and whiteboard for live tutoring
- **Help Request System** - Students can post doubts; tutors can accept and start sessions
- **AI-Powered Doubt Classification** - Automatically categorizes doubts by urgency and difficulty
- **Persistent Sidebar** - Quick navigation across the application

### GenAI Features (New!)
- **AI Mentor Chatbot** - Real-time chat with an intelligent tutor during sessions
- **Doubt Classifier** - Analyzes student questions and extracts urgency, difficulty, subject, topic
- **Quiz Generator** - Creates custom practice quizzes on any topic with MCQs and explanations
- **Summary Generator** - Generates multi-format summaries from tutoring sessions
- **Smart Tutor Matching** - Uses AI analysis to match students with the best tutors

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API Key (free at [console.groq.com](https://console.groq.com))
- Clerk API Keys (for authentication)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd learnloop
   npm install
   ```

2. **Set up environment variables** (`.env.local`):
   ```bash
   # Database
   MONGODB_URL=mongodb://localhost:27017/learnloop

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret

   # GenAI - Groq API (Required)
   GROQ_API_KEY=your_groq_api_key

   # Optional: External backend (if using proxies)
   GENAI_BACKEND_URL=http://localhost:5000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## GenAI Integration

LearnLoop now includes full AI-powered features powered by Groq and LangChain:

- **Automatic Doubt Analysis** - When students post a question, AI automatically classifies it
- **AI Mentor in Sessions** - Students can chat with the AI mentor during tutoring sessions (tab next to tutor chat)
- **Quiz Generation** - Generate practice quizzes on any topic with difficulty levels
- **Session Summaries** - Auto-generate summaries from tutoring transcripts

### Getting Started with GenAI

1. **Get a Groq API Key:**
   - Visit [console.groq.com](https://console.groq.com)
   - Sign up and create an API key
   - Add to `.env.local`: `GROQ_API_KEY=your_key`

2. **Test the features:**
   - Go to `/ask-for-help` and post a question → AI analyzes and classifies it
   - Start a tutoring session and click the "AI Mentor" tab to chat with the AI
   - Use the quiz generator via API: `POST /api/ai/generate-quiz`

### Full Documentation

See [GENAI_INTEGRATION.md](./GENAI_INTEGRATION.md) for:
- Detailed feature descriptions
- API endpoints and response schemas
- Code examples for client and server usage
- Troubleshooting guide

## Project Structure

```
learnloop/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── ai/                   # GenAI endpoints
│   │   │   ├── analyze-doubt/
│   │   │   ├── chat/
│   │   │   ├── chat/stream/
│   │   │   ├── generate-quiz/
│   │   │   └── generate-summary/
│   │   ├── session/              # Session management
│   │   ├── help-request/         # Help request creation
│   │   ├── dashboard/            # Dashboard data
│   │   └── subjects/             # Subject & topic management
│   ├── dashboard/                # Main dashboard
│   ├── session/[id]/             # Tutoring session page
│   ├── ask-for-help/             # Help request form
│   └── ...
├── lib/
│   ├── genai/                    # GenAI services
│   │   ├── groq.ts              # Groq model initialization
│   │   ├── prompts.ts           # Prompt templates
│   │   └── services/            # AI services
│   ├── useSocket.ts             # Socket.io client hook
│   ├── useGenAIHooks.ts         # GenAI client hooks
│   ├── connectDb.ts             # MongoDB connection
│   └── syncUser.ts              # Clerk user sync
├── models/                       # Mongoose schemas
│   ├── user.model.ts
│   ├── helpRequest.model.ts
│   ├── session.model.ts
│   └── ...
├── public/                       # Static assets
├── GENAI_INTEGRATION.md          # GenAI feature documentation
└── README.md                     # This file
```

## Key Endpoints

### GenAI Endpoints
- `POST /api/ai/analyze-doubt` - Classify a doubt
- `POST /api/ai/chat` - Chat with AI mentor
- `POST /api/ai/chat/stream` - Stream chat response (SSE)
- `POST /api/ai/generate-quiz` - Generate quiz questions
- `POST /api/ai/generate-summary` - Generate session summary

### Tutoring Endpoints
- `GET /api/dashboard` - Get dashboard data
- `POST /api/help-request` - Create a help request
- `GET /api/available-questions` - Get open help requests (for tutors)
- `POST /api/tutor/accept-request` - Accept a help request and create session
- `GET /api/session/:id` - Get session details
- `POST /api/session/:id` - Update session (via Socket.io)

## Technology Stack

- **Frontend:** React 19, Next.js 16, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB, Mongoose
- **Real-time:** Socket.io
- **Authentication:** Clerk
- **AI:** Groq API, LangChain, ChatGroq
- **Streaming:** Server-Sent Events (SSE)

## Architecture

### Real-time Communication
- **Socket.io Server** (server.js) - Handles peer messaging, whiteboard, cursor movements
- **Client Hook** (useSocket.ts) - React hook for Socket.io integration
- **Session Page** - Real-time tutor-student interaction

### AI Integration
- **Groq LLM** - Powers all AI features (free tier available)
- **LangChain** - Abstracts LLM interactions and memory management
- **Conversation Memory** - Maintains chat history for contextual responses
- **Structured Parsing** - Uses Zod for guaranteed output schemas

## Running with Socket.io

The dev server uses a custom Node server (server.js) to run Next.js with Socket.io:

```bash
npm run dev
# Runs: node server.js (which starts next dev and socket.io)
```

For production:
```bash
npm run build
npm start
# Runs: node server.js with next build artifacts
```

## Deployment

### Environment Variables
Make sure these are set in your deployment platform:
- `MONGODB_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `GROQ_API_KEY`

### Platforms
- **Vercel** - Recommended for Next.js (requires custom server.js integration for Socket.io)
- **Railway** - Good support for Node.js + Socket.io
- **Self-hosted** - Docker + Node.js server

## Troubleshooting

### GenAI Issues
See [GENAI_INTEGRATION.md](./GENAI_INTEGRATION.md#troubleshooting) for detailed troubleshooting steps.

### Common Issues
- **"GROQ_API_KEY not set"** - Add to `.env.local` and restart dev server
- **Socket.io not connecting** - Ensure `npm run dev` is running the custom server
- **Mongoose connection failed** - Check `MONGODB_URL` and ensure MongoDB is running

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit PR with description

## Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [LangChain JS Docs](https://js.langchain.com)
- [Groq API Docs](https://console.groq.com/docs)
- [Socket.io Docs](https://socket.io/docs)
- [MongoDB Mongoose](https://mongoosejs.com)

## License

MIT
