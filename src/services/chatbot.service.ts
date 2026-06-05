import {
  SendMessageRequest,
  ChatMessageResponse,
  ChatHistoryResponse,
  SessionsResponse,
  ChatStats,
  FAQ,
  CreateFaqRequest,
} from '../types/chatbot.types';
import { apiClient } from '../api/apiClient';

class ChatbotService {
  private getUserData() {
    const userStr = localStorage.getItem('user');
    const empresaId = localStorage.getItem('l_empresa_id') || 'default';

    if (!userStr) {
      throw new Error('No hay usuario autenticado');
    }

    const user = JSON.parse(userStr);
    const colaboradorID = user.id || user.colaboradorID || user.user_code;

    return { colaboradorID, empresaId };
  }

  /**
   * Enviar un mensaje al chatbot con reintentos automáticos
   */
  async sendMessage(message: string, retries = 3): Promise<ChatMessageResponse> {
    const { colaboradorID, empresaId } = this.getUserData();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data } = await apiClient.post<ChatMessageResponse>(
          `/api/chatbot/message?colaboradorID=${colaboradorID}&empresaId=${empresaId}`,
          { message } as SendMessageRequest,
        );
        return data;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Intento ${attempt} de ${retries} falló:`, lastError.message);

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('Error desconocido al enviar mensaje');
  }

  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const { data } = await apiClient.get<ChatHistoryResponse>(
      `/api/chatbot/history/${sessionId}`,
    );
    return data;
  }

  async getSessions(limit = 10, offset = 0): Promise<SessionsResponse> {
    const { data } = await apiClient.get<SessionsResponse>(
      `/api/chatbot/sessions?limit=${limit}&offset=${offset}`,
    );
    return data;
  }

  async getStats(): Promise<ChatStats> {
    const { data } = await apiClient.get<ChatStats>('/api/chatbot/stats');
    return data;
  }

  async getFaqs(includeInactive = false): Promise<FAQ[]> {
    const { data } = await apiClient.get<FAQ[]>(
      `/api/chatbot/faq?includeInactive=${includeInactive}`,
    );
    return data;
  }

  async createFaq(faq: CreateFaqRequest): Promise<FAQ> {
    const { data } = await apiClient.post<FAQ>('/api/chatbot/faq', faq);
    return data;
  }
}

export const chatbotService = new ChatbotService();
