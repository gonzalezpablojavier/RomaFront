import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chatbot.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Función para formatear el mensaje con links y saltos de línea
const formatMessage = (text: string): string => {
  return text
    // Convertir URLs a enlaces clicables
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-700">$1</a>'
    )
    // Convertir saltos de línea a <br>
    .replace(/\n/g, '<br>')
    // Convertir listas con • a HTML
    .replace(/•\s*(.+)/g, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside space-y-1 mt-2">$1</ul>');
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        {isUser ? (
          <User size={18} className="text-white" />
        ) : (
          <Bot size={18} className="text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`flex-1 max-w-[80%] ${
          isUser ? 'items-end' : 'items-start'
        } flex flex-col`}
      >
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
          }`}
        >
          <div 
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />

          {/* Metadata (solo para mensajes del bot) */}
          {!isUser && message.metadata?.faqIds && message.metadata.faqIds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              Basado en: FAQ-{message.metadata.faqIds.join(', FAQ-')}
            </div>
          )}

          {/* Mostrar área si está disponible */}
          {!isUser && message.metadata?.area && (
            <div className="mt-1 flex gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-0.5 rounded">
                {message.metadata.area}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

