import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { PromptTemplate } from 'langchain/prompts';
import { initializeStreamingGroqModel } from '../groq';
import { createMentorChatSystemPrompt } from '../prompts';

// Store conversations in memory (in production, use database)
const conversations = new Map<
  string,
  { memory: BufferMemory; createdAt: number; lastActivity: number }
>();

interface ConversationMemory {
  memory: BufferMemory;
  createdAt: number;
  lastActivity: number;
}

const getConversationMemory = (conversationId: string): BufferMemory => {
  if (!conversations.has(conversationId)) {
    const memory = new BufferMemory({
      memoryKey: 'chat_history',
      inputKey: 'input',
      returnMessages: true,
    });

    conversations.set(conversationId, {
      memory,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  const conv = conversations.get(conversationId) as ConversationMemory;
  conv.lastActivity = Date.now();

  return conv.memory;
};

export async function sendMessage(
  conversationId: string,
  message: string
): Promise<{ conversationId: string; userMessage: string; mentorResponse: string; timestamp: string }> {
  try {
    const model = initializeStreamingGroqModel();
    const memory = getConversationMemory(conversationId);
    const systemPrompt = createMentorChatSystemPrompt();

    const prompt = PromptTemplate.fromTemplate(`${systemPrompt}

Conversation history:
{chat_history}

Student: {input}

AI Mentor:`);

    // Create conversation chain
    const chain = new ConversationChain({
      llm: model,
      memory,
      prompt,
    });

    // Get response
    const response = await chain.call({ input: message });

    return {
      conversationId,
      userMessage: message,
      mentorResponse: response.response || '',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Chat error:', error);
    throw new Error(`Chat failed: ${(error as any).message}`);
  }
}

export async function* streamMessage(conversationId: string, message: string) {
  try {
    const model = initializeStreamingGroqModel();
    const memory = getConversationMemory(conversationId);
    const systemPrompt = createMentorChatSystemPrompt();

    const prompt = PromptTemplate.fromTemplate(`${systemPrompt}

Conversation history:
{chat_history}

Student: {input}

AI Mentor:`);

    const chain = new ConversationChain({
      llm: model,
      memory,
      prompt,
    });

    // For streaming, we use the LLM's stream method
    const response = await chain.llm.stream(
      await prompt.format({
        chat_history: await memory.loadMemoryVariables({}),
        input: message,
      })
    );

    for await (const chunk of response) {
      if (chunk.content) {
        yield chunk.content;
      }
    }

    // Save to memory after streaming
    await memory.saveContext({ input: message }, { response: 'Response saved' });
  } catch (error) {
    console.error('Stream chat error:', error);
    throw new Error(`Streaming chat failed: ${(error as any).message}`);
  }
}

export async function getConversationHistory(conversationId: string): Promise<Record<string, any>> {
  const conv = conversations.get(conversationId);
  if (!conv) {
    return { conversationId, messages: [] };
  }

  const variables = await conv.memory.loadMemoryVariables({});
  return {
    conversationId,
    createdAt: new Date(conv.createdAt).toISOString(),
    lastActivity: new Date(conv.lastActivity).toISOString(),
    ...variables,
  };
}

export function clearConversation(conversationId: string): { success: boolean; message: string } {
  conversations.delete(conversationId);
  return {
    success: true,
    message: `Conversation ${conversationId} cleared`,
  };
}
