'use client';

import { useState } from 'react';

interface UseGenAIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useDoubtAnalyzer = (options?: UseGenAIOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyze = async (doubtText: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analysis failed');
      options?.onSuccess?.(data.data);
      return data.data;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error };
};

export const useQuizGenerator = (options?: UseGenAIOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = async (topic: string, difficulty: string, numberOfQuestions: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, numberOfQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Quiz generation failed');
      options?.onSuccess?.(data.data);
      return data.data;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
};

export const useSummaryGenerator = (options?: UseGenAIOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = async (transcript: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Summary generation failed');
      options?.onSuccess?.(data.data);
      return data.data;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
};

export const useMentorChat = (options?: UseGenAIOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (message: string, conversationId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Chat failed');
      options?.onSuccess?.(data.data);
      return data.data;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
};
