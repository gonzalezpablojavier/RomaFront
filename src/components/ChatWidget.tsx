import React, { useState, useEffect } from 'react';
import { Send, MessagesSquare, X, Trash2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../session/sessionStore';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  
  const { messages, isLoading, typingMessage, sendMessage, clearChat, messagesEndRef } = useChat({
    autoScroll: true,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Verificar si el usuario puede ver el chat (solo colaboradorID 1, 8, 9)
  const canUseChat = (): boolean => {
    try {
      const colaboradorID = getSessionUserId();
      if (!colaboradorID) return false;
      return [1, 8, 9, 7, 244, 16].includes(Number(colaboradorID));
    } catch (error) {
      console.error('Error verificando colaboradorID:', error);
      return false;
    }
  };

  // Si no puede usar el chat, no renderizar nada
  if (!canUseChat()) {
    return null;
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    
    if (window.confirm('¿Estás seguro de que querés limpiar toda la conversación?')) {
      clearChat();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110 z-[9999]"
        aria-label="Abrir chat"
      >
        <MessagesSquare size={20} className="sm:w-6 sm:h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] h-[calc(100vh-8rem)] sm:w-96 sm:h-[600px] md:w-96 md:h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl flex flex-col z-[9999] border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-3 sm:p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessagesSquare size={20} className="sm:w-6 sm:h-6" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Asistente ROMA</h3>
            <p className="text-xs text-blue-100 hidden sm:block">Estamos aquí para ayudarte</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Botón de limpiar chat */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="hover:bg-blue-700 rounded p-1 transition-colors"
              aria-label="Limpiar conversación"
              title="Limpiar conversación"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
          {/* Botón de cerrar */}
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 rounded p-1 transition-colors"
            aria-label="Cerrar chat"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Área de sugerencias persistentes */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
              <MessagesSquare size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-800 mb-2">
                <strong>¡Hola! 👋</strong> Soy el asistente virtual de ROMA. ¿En qué puedo ayudarte hoy?
              </div>
              <div className="text-xs text-gray-600">
                Puedes preguntarme sobre:
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 whitespace-nowrap">
                  • Información de Roma
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 whitespace-nowrap">
                  • Áreas y departamentos
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 whitespace-nowrap">
                  • Hábitos y Pilares
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 whitespace-nowrap">
                  • Y mucho más...
                </span>
              </div>
            </div>
          </div>
      </div>
        
      {/* Área de mensajes con scroll */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
          {/* Mensajes del chat */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-gray-500 bg-gray-100 p-3 rounded-lg max-w-[80%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm font-medium">{typingMessage}...</span>
            </div>
          )}
          
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Enviar mensaje"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Presioná Enter para enviar
        </p>
      </div>
    </div>
  );
};

