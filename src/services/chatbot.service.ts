import { 
  SendMessageRequest, 
  ChatMessageResponse,
  ChatHistoryResponse,
  SessionsResponse,
  ChatStats,
  FAQ,
  CreateFaqRequest
} from '../types/chatbot.types';
import { getApiUrl } from '../config/env';

const API_BASE_URL = getApiUrl();

class ChatbotService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

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
        const response = await fetch(
          `${API_BASE_URL}/api/chatbot/message?colaboradorID=${colaboradorID}&empresaId=${empresaId}`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ message } as SendMessageRequest),
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Intento ${attempt} de ${retries} falló:`, lastError.message);

        // Si no es el último intento, esperar antes de reintentar (backoff exponencial)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('Error desconocido al enviar mensaje');
  }

  /**
   * Obtener historial de una sesión
   */
  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/history/${sessionId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Listar sesiones del usuario
   */
  async getSessions(limit = 10, offset = 0): Promise<SessionsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/sessions?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<ChatStats> {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtener todas las FAQs
   */
  async getFaqs(includeInactive = false): Promise<FAQ[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/chatbot/faq?includeInactive=${includeInactive}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Crear nueva FAQ (solo admins)
   */
  async createFaq(faq: CreateFaqRequest): Promise<FAQ> {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/faq`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(faq),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const chatbotService = new ChatbotService();

