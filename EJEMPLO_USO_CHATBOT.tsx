/**
 * 🤖 EJEMPLO DE USO DEL CHATBOT
 * 
 * Este archivo muestra cómo integrar el ChatWidget en tu App.tsx
 */

// ==================== OPCIÓN 1: Widget Flotante (RECOMENDADO) ====================
// Este widget aparecerá en todas las páginas

import { PropsWithChildren, useEffect, useState } from 'react';
import { ChatWidget } from './components/ChatWidget'; // ← IMPORTAR ESTO
import { ToastContainer } from 'react-toastify';

function App({ children }: PropsWithChildren) {
    // ... tu código existente ...

    return (
        <div className="main-section antialiased relative font-nunito text-sm font-normal bg-white">
            {children}
            <ToastContainer />
            
            {/* 👇 AGREGAR ESTA LÍNEA PARA EL WIDGET FLOTANTE */}
            <ChatWidget />
        </div>
    );
}

export default App;

// ==================== OPCIÓN 2: Solo en Páginas Específicas ====================
// Si solo querés el chat en ciertas páginas

import { ChatWidget } from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';

function HomePage() {
    const { user } = useAuth();

    return (
        <div className="container">
            <h1>Bienvenido {user.name}</h1>
            
            {/* Chat solo en esta página */}
            <ChatWidget />
        </div>
    );
}

// ==================== OPCIÓN 3: Chat con Condiciones ====================
// Mostrar el chat solo para ciertos roles o condiciones

function AppCondicional({ children }: PropsWithChildren) {
    const { user } = useAuth();
    
    // Ejemplo: mostrar chat solo para colaboradores, no para admins
    const showChat = user && user.role !== 'admin';

    return (
        <div className="main-section">
            {children}
            <ToastContainer />
            
            {/* Chat condicional */}
            {showChat && <ChatWidget />}
        </div>
    );
}

// ==================== OPCIÓN 4: Botón Personalizado ====================
// Si querés un botón personalizado en tu navbar

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { ChatWidget } from './components/ChatWidget';

function CustomNavbar() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <nav>
            {/* Tu navbar existente */}
            
            {/* Botón personalizado para abrir chat */}
            <button 
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <Bot size={20} />
                <span>Asistente</span>
            </button>

            {/* Widget que se controla externamente */}
            {isChatOpen && <ChatWidget />}
        </nav>
    );
}

// ==================== OPCIÓN 5: Link en el Menú ====================
// Agregar un link al chat en tu sidebar

import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Tus otros links */}
            
            {/* Link al chat en página completa */}
            <Link 
                to="/ChatBot" 
                className="sidebar-link flex items-center gap-2"
            >
                <Bot size={20} />
                <span>Asistente Virtual</span>
            </Link>
        </aside>
    );
}

// ==================== TIPS Y TRUCOS ====================

/**
 * 1. CAMBIAR POSICIÓN DEL WIDGET:
 * 
 * En ChatWidget.tsx, cambiá las clases:
 * - bottom-6 right-6  → esquina inferior derecha (actual)
 * - bottom-6 left-6   → esquina inferior izquierda
 * - top-6 right-6     → esquina superior derecha
 * - top-6 left-6      → esquina superior izquierda
 */

/**
 * 2. CAMBIAR COLORES:
 * 
 * En ChatWidget.tsx:
 * - bg-blue-600 → bg-green-600 (verde)
 * - bg-blue-600 → bg-purple-600 (morado)
 * - bg-blue-600 → bg-red-600 (rojo)
 */

/**
 * 3. ABRIR AUTOMÁTICAMENTE AL CARGAR:
 * 
 * En ChatWidget.tsx, cambiá:
 * const [isOpen, setIsOpen] = useState(false);
 * por:
 * const [isOpen, setIsOpen] = useState(true);
 */

/**
 * 4. AGREGAR NOTIFICACIÓN DE SONIDO:
 */
import { useChat } from '../hooks/useChat';

function ChatConSonido() {
    const { messages, sendMessage } = useChat({
        onError: (error) => console.error(error)
    });

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                // Reproducir sonido cuando el bot responde
                const audio = new Audio('/notification.mp3');
                audio.play().catch(err => console.log('Audio error:', err));
            }
        }
    }, [messages]);

    return null;
}

/**
 * 5. INTEGRAR CON TOAST (Notificaciones):
 */
import { toast } from 'react-toastify';

function ChatConNotificaciones() {
    const { messages, sendMessage } = useChat({
        onError: (error) => {
            toast.error('Error en el chat: ' + error.message);
        }
    });

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                toast.info('¡Nuevo mensaje del asistente!', {
                    autoClose: 3000
                });
            }
        }
    }, [messages]);

    return null;
}

// ==================== RECOMENDACIÓN FINAL ====================

/**
 * 👉 PARA EMPEZAR RÁPIDO:
 * 
 * 1. Agregá esto en tu App.tsx:
 * 
 *    import { ChatWidget } from './components/ChatWidget';
 * 
 *    // Dentro del return, antes del </div> final:
 *    <ChatWidget />
 * 
 * 2. ¡Listo! El chat aparecerá en todas las páginas
 * 
 * 3. Si preferís una página completa, ya está la ruta /ChatBot
 */

