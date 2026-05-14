import { ChatGroq } from '@langchain/groq';

// Initialize default ChatGroq model (balanced, factual)
export const initializeGroqModel = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    modelName: 'mixtral-8x7b-32768',
    temperature: 0.3,
    maxTokens: 2048,
  });
};

// Initialize creative ChatGroq model (more creative)
export const initializeCreativeGroqModel = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    modelName: 'mixtral-8x7b-32768',
    temperature: 0.7,
    maxTokens: 2048,
  });
};

// Initialize deterministic model (most factual)
export const initializeDeterministicGroqModel = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    modelName: 'mixtral-8x7b-32768',
    temperature: 0.1,
    maxTokens: 2048,
  });
};

// Initialize streaming model
export const initializeStreamingGroqModel = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    modelName: 'mixtral-8x7b-32768',
    temperature: 0.3,
    maxTokens: 1024,
    streaming: true,
  });
};
