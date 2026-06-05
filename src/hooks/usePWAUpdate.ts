import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Keys para sessionStorage - previene bucles infinitos de reload
const RELOAD_KEY = 'pwa-just-reloaded';
const RELOAD_COUNT_KEY = 'pwa-reload-count';
const RELOAD_COOLDOWN = 10000; // 10 segundos de cooldown entre reloads
const MAX_RELOADS_PER_SESSION = 3; // Máximo 3 reloads por sesión de navegador

/**
 * Hook para manejar actualizaciones automáticas del PWA
 * Con skipWaiting: true en workbox, las actualizaciones son automáticas
 * 
 * PROTECCIÓN ANTI-BUCLE (doble capa):
 * 1. Cooldown: No permite reload si pasaron menos de 10 segundos del anterior
 * 2. Contador: Máximo 3 reloads por sesión de navegador
 * 
 * Si se alcanza el límite, la app NO recarga y muestra warning en consola.
 * El usuario puede cerrar la pestaña y volver a abrir para resetear el contador.
 */
export function usePWAUpdate() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (import.meta.env.DEV) return;

    // Verificar si acabamos de recargar (protección anti-bucle)
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    const justReloaded = lastReload && (Date.now() - parseInt(lastReload, 10)) < RELOAD_COOLDOWN;
    
    if (justReloaded) {
      console.log('[PWA] Reload reciente detectado, saltando verificación para evitar bucle');
      sessionStorage.removeItem(RELOAD_KEY); // Limpiar para próxima vez
    }

    // Mostrar contador actual en consola para debugging
    const currentCount = parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0', 10);
    if (currentCount > 0) {
      console.log(`[PWA] Reloads en esta sesión: ${currentCount}/${MAX_RELOADS_PER_SESSION}`);
    }

    // Variables para cleanup
    let handleVisibilityChange: (() => void) | null = null;
    let handleFocus: (() => void) | null = null;

    navigator.serviceWorker.ready.then((reg) => {
      // Escuchar actualizaciones
      const handleUpdate = () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nueva versión instalada, reload automático próximamente');
              toast.info('Nueva versión disponible. Actualizando...', {
                autoClose: 3000,
                closeOnClick: true,
              });
            }
          });
        }
      };

      reg.addEventListener('updatefound', handleUpdate);

      // Verificar actualizaciones periódicamente (cada hora)
      intervalRef.current = window.setInterval(() => {
        reg.update().catch((err) => {
          console.log('[PWA] Error al verificar actualizaciones:', err);
        });
      }, 60 * 60 * 1000);

      // Verificar al volver a la app
      handleVisibilityChange = () => {
        if (!document.hidden) {
          reg.update().catch(console.error);
        }
      };

      handleFocus = () => {
        reg.update().catch(console.error);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    });

    // Listener para cuando el SW toma control - CON PROTECCIÓN ANTI-BUCLE (doble capa)
    const handleControllerChange = () => {
      // CAPA 1: Verificar cooldown (10 segundos)
      const lastReloadTime = sessionStorage.getItem(RELOAD_KEY);
      const recentlyReloaded = lastReloadTime && (Date.now() - parseInt(lastReloadTime, 10)) < RELOAD_COOLDOWN;

      if (recentlyReloaded) {
        console.warn('[PWA] ⚠️ Cooldown activo! Reload abortado (menos de 10s del anterior)');
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }

      // CAPA 2: Verificar contador máximo por sesión
      const reloadCount = parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0', 10);
      
      if (reloadCount >= MAX_RELOADS_PER_SESSION) {
        console.error(`[PWA] 🛑 LÍMITE ALCANZADO! Ya se hicieron ${reloadCount} reloads en esta sesión.`);
        console.error('[PWA] La app NO recargará más. Cerrá y volvé a abrir la pestaña si necesitás actualizar.');
        toast.warning('Actualización pausada. Cerrá y volvé a abrir la app para continuar.', {
          autoClose: false,
          closeOnClick: true,
        });
        return;
      }

      // Incrementar contador y marcar timestamp
      sessionStorage.setItem(RELOAD_COUNT_KEY, (reloadCount + 1).toString());
      sessionStorage.setItem(RELOAD_KEY, Date.now().toString());
      
      console.log(`[PWA] Recargando para aplicar nueva versión... (reload ${reloadCount + 1}/${MAX_RELOADS_PER_SESSION})`);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Cleanup CORRECTO en el nivel superior del useEffect
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (handleVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (handleFocus) {
        window.removeEventListener('focus', handleFocus);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);
}

