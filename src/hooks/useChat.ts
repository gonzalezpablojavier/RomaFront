import { useState, useCallback, useRef, useEffect } from 'react';
import { chatbotService } from '../services/chatbot.service';
import { ChatMessage } from '../types/chatbot.types';

interface UseChatOptions {
  autoScroll?: boolean;
  onError?: (error: Error) => void;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { autoScroll = true, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typingMessage, setTypingMessage] = useState('Escribiendo');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Función para limpiar el saludo repetitivo
  const cleanBotResponse = (response: string): string => {
    // Si ya saludó antes, quitar el saludo de respuestas posteriores
    if (hasGreeted) {
      // Remover "¡Hola Pablo!" y variaciones del inicio
      return response.replace(/^\*\*¡Hola\s+\w+!\*\*\s*/i, '').trim();
    }
    return response;
  };

  // Efecto para el typing indicator progresivo
  useEffect(() => {
    if (!isLoading || !loadingStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - loadingStartTime;
      
      if (elapsed < 3000) {
        setTypingMessage('✍️ Escribiendo');
      } else if (elapsed < 6000) {
        setTypingMessage('🔍 Analizando tu consulta');
      } else if (elapsed < 10000) {
        setTypingMessage('✨ Preparando respuesta');
      } else {
        setTypingMessage('⏳ Casi listo');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, loadingStartTime]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Agregar mensaje del usuario inmediatamente
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    setTypingMessage('✍️ Escribiendo');

    try {
      const response = await chatbotService.sendMessage(message);

      // Guardar sessionId si es la primera vez
      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      // Limpiar respuesta del bot y marcar si ya saludó
      const cleanedAnswer = cleanBotResponse(response.answer);
      
      // Detectar si esta respuesta contiene un saludo (primera vez)
      if (response.answer.match(/^\*\*¡Hola\s+\w+!\*\*/i)) {
        setHasGreeted(true);
      }

      // Agregar respuesta del bot
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: cleanedAnswer,
        metadata: {
          faqIds: response.sources,
          ...response.nluResult,
        },
        timestamp: response.timestamp,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      onError?.(error as Error);

      // Agregar mensaje de error
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStartTime(null);
    }
  }, [sessionId, onError]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setHasGreeted(false); // Resetear el estado de saludo
  }, []);

  const loadHistory = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const history = await chatbotService.getHistory(sessionId);
      setMessages(history.messages);
      setSessionId(history.sessionId);
    } catch (error) {
      console.error('Error loading history:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  return {
    messages,
    isLoading,
    sessionId,
    typingMessage,
    sendMessage,
    clearChat,
    loadHistory,
    messagesEndRef,
  };
};

