// ==================== Request Types ====================

export interface SendMessageRequest {
  message: string;
}

export interface CreateFaqRequest {
  pregunta: string;
  respuesta: string;
  keywords: string[];
  area: string;
  relevanceScore?: number;
}

// ==================== Response Types ====================

export interface NLUResult {
  intent: string;
  keywords: string[];
  entities: Record<string, any>;
  area: string;
  confidence: number;
}

export interface ChatMessageResponse {
  sessionId: string;
  answer: string;
  sources: number[]; // IDs de FAQs usadas
  nluResult: NLUResult;
  timestamp: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    intent?: string;
    keywords?: string[];
    entities?: Record<string, any>;
    area?: string;
    faqIds?: number[];
    confidence?: number;
  };
  timestamp: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  colaboradorID: number;
  sessionDate: string;
  messages: ChatMessage[];
}

export interface ChatSession {
  id: string;
  colaboradorID: number;
  empresaId: string;
  sessionDate: string;
  startedAt: string;
  lastMessageAt: string;
  isActive: boolean;
  messageCount?: number;
}

export interface SessionsResponse {
  sessions: ChatSession[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatStats {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  mostUsedFaqs: Array<{
    id: number;
    pregunta: string;
    useCount: number;
    area: string;
  }>;
}

// ==================== FAQ Types ====================

export interface FAQ {
  id: number;
  pregunta: string;
  respuesta: string;
  keywords: string[];
  area: string;
  useCount: number;
  relevanceScore: number;
  empresaId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

