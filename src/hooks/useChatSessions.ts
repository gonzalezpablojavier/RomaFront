import { useState, useEffect, useCallback } from 'react';
import { chatbotService } from '../services/chatbot.service';
import { ChatSession } from '../types/chatbot.types';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSessions = useCallback(async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatbotService.getSessions(limit, offset);
      setSessions(response.sessions);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    reload: loadSessions,
  };
};

