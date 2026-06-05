# 🤖 Integración del Chatbot - Instrucciones

## ✅ Archivos Creados

Se han creado los siguientes archivos:

```
src/
├── types/
│   └── chatbot.types.ts           ✅ Tipos TypeScript
├── services/
│   └── chatbot.service.ts         ✅ Servicio de API
├── hooks/
│   ├── useChat.ts                 ✅ Hook principal
│   └── useChatSessions.ts         ✅ Hook de sesiones
├── components/
│   ├── ChatMessage.tsx            ✅ Componente de mensaje
│   └── ChatWidget.tsx             ✅ Widget flotante
└── pages/Apps/
    └── ChatPage.tsx               ✅ Página completa
```

## 🚀 Cómo Usar

### Opción 1: Widget Flotante (Recomendado)

Agregá el widget en tu layout principal o en `App.tsx`:

```tsx
// En App.tsx o en tu layout principal
import { ChatWidget } from './components/ChatWidget';

function App({ children }) {
  return (
    <div className="main-section">
      {children}
      
      {/* Widget flotante - aparece en todas las páginas */}
      <ChatWidget />
      
      <ToastContainer />
    </div>
  );
}
```

### Opción 2: Página Completa

Ya está agregada la ruta en `routes.tsx`:

```
/ChatBot
```

Podés acceder desde cualquier lugar:

```tsx
import { Link } from 'react-router-dom';

<Link to="/ChatBot">
  <button>Ir al Chat</button>
</Link>
```

## 🔧 Configuración

### Backend URL

El servicio está configurado para usar:
```
https://distrimdp.dvrdns.org/rrhh/api/chatbot/message
```

Si necesitás cambiar la URL, editá `src/services/chatbot.service.ts`:

```typescript
const API_BASE_URL = 'TU_URL_AQUI';
```

### Autenticación

El servicio obtiene automáticamente:
- **Token JWT**: desde `localStorage.getItem('token')`
- **ColaboradorID**: desde el user en localStorage
- **EmpresaID**: desde `localStorage.getItem('l_empresa_id')`

Si tu estructura de user es diferente, ajustá el método `getUserData()` en `chatbot.service.ts`.

## 🎨 Personalización

### Cambiar colores del widget

En `ChatWidget.tsx`:

```tsx
// Header azul → cambiar a verde
bg-blue-600 → bg-green-600
hover:bg-blue-700 → hover:bg-green-700

// Botón flotante
bg-blue-600 → bg-purple-600
```

### Cambiar tamaño del widget

En `ChatWidget.tsx`, línea del div principal:

```tsx
// Ancho y alto actuales
w-96 h-[600px]

// Ejemplo: más grande
w-[500px] h-[700px]
```

### Cambiar posición del botón flotante

```tsx
// Abajo-derecha (actual)
bottom-6 right-6

// Abajo-izquierda
bottom-6 left-6

// Arriba-derecha
top-6 right-6
```

## 📱 Componentes Disponibles

### ChatWidget
Widget flotante que aparece como un botón y se expande al hacer clic.

```tsx
import { ChatWidget } from './components/ChatWidget';

<ChatWidget />
```

### ChatPage
Página completa de chat con historial de sesiones.

```tsx
// Ya está en las rutas como /ChatBot
```

### ChatMessage
Componente individual de mensaje (usado internamente).

```tsx
import { ChatMessage } from './components/ChatMessage';

<ChatMessage message={messageObject} />
```

## 🪝 Hooks Disponibles

### useChat
Hook principal para manejar la lógica del chat.

```tsx
import { useChat } from '../hooks/useChat';

const { 
  messages,        // Array de mensajes
  isLoading,       // Estado de carga
  sessionId,       // ID de la sesión actual
  sendMessage,     // Función para enviar mensaje
  clearChat,       // Limpiar chat
  loadHistory,     // Cargar historial
  messagesEndRef   // Ref para scroll automático
} = useChat({
  autoScroll: true,
  onError: (error) => console.error(error)
});
```

### useChatSessions
Hook para gestionar sesiones de chat.

```tsx
import { useChatSessions } from '../hooks/useChatSessions';

const { 
  sessions,   // Array de sesiones
  loading,    // Estado de carga
  error,      // Error si existe
  reload      // Recargar sesiones
} = useChatSessions();
```

## 🧪 Testing Rápido

1. **Iniciar el servidor backend** (debe estar en https://distrimdp.dvrdns.org/rrhh)

2. **Iniciar el frontend**:
   ```bash
   npm run dev
   ```

3. **Probar el widget**:
   - Deberías ver un botón flotante azul con un ícono de bot en la esquina inferior derecha
   - Hacé clic para abrir el chat
   - Escribí un mensaje y presioná Enter

4. **Probar la página completa**:
   - Navegá a `/ChatBot`
   - Deberías ver el chat en pantalla completa

## 🐛 Troubleshooting

### El botón no aparece
- Verificá que importaste `ChatWidget` en tu componente principal
- Revisá la consola por errores

### No puedo enviar mensajes
- Verificá que el backend esté corriendo
- Abrí DevTools → Network y mirá si la petición llega
- Verificá que tengas user y empresaId en localStorage

### Error "No hay usuario autenticado"
- Asegurate de estar logueado
- Verificá que `localStorage.getItem('user')` tenga datos

### CORS Error
- El backend debe tener habilitado CORS para tu dominio
- Verificá los headers en las respuestas del servidor

## 📊 Próximos Pasos (Opcional)

Si querés agregar más features:

1. **Notificaciones de nuevos mensajes**
   ```tsx
   // En useChat.ts, cuando llega un mensaje del bot
   toast.info('¡Nuevo mensaje del asistente!');
   ```

2. **Sonido al recibir mensaje**
   ```tsx
   const audio = new Audio('/notification.mp3');
   audio.play();
   ```

3. **Indicador de mensajes no leídos**
   ```tsx
   const [unreadCount, setUnreadCount] = useState(0);
   ```

4. **Modo oscuro**
   ```tsx
   // Agregar clases dark: en los componentes
   className="bg-white dark:bg-gray-800"
   ```

## 📝 Notas Importantes

- ✅ El widget usa `lucide-react` (ya instalado)
- ✅ Usa Tailwind CSS (ya configurado)
- ✅ TypeScript con tipos estrictos
- ✅ Responsive (se adapta a mobile)
- ✅ Accesibilidad (aria-labels incluidos)

---

**¿Preguntas?** Revisá el código de los componentes, está bien comentado.

---

## 🆕 Nuevas Features Agregadas

El chatbot ahora incluye mejoras inspiradas en el diseño PHP:

### 1. ⏳ Typing Indicator Progresivo
El indicador cambia dinámicamente:
- 0-3s: ✍️ Escribiendo...
- 3-6s: 🔍 Analizando tu consulta...
- 6-10s: ✨ Preparando respuesta...
- 10s+: ⏳ Casi listo...

### 2. 🔄 Reintentos Automáticos
- 3 reintentos automáticos con backoff exponencial
- Maneja errores de red temporales sin molestar al usuario

### 3. 🎨 Gradiente en Header
- Header con gradiente moderno `from-blue-600 to-blue-500`
- Look & feel más profesional

### 4. 🔗 Formateo Avanzado
- URLs se convierten en links clicables
- Saltos de línea (`\n`) → `<br>`
- Listas con • → HTML `<ul><li>`

**Ver más detalles**: Abrí `NUEVAS_FEATURES_CHATBOT.md`

