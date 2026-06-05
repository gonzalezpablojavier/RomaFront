import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

const root = process.cwd();
config({ path: path.join(root, '.env') });

const output = path.join(root, 'public', 'firebase-messaging-sw.js');

function isFirebaseEnabled() {
  const flag = String(process.env.VITE_FIREBASE_ENABLED ?? '').toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  if (flag === 'true' || flag === '1' || flag === 'yes') return true;

  const apiKey = String(process.env.VITE_FIREBASE_API_KEY ?? '').trim();
  const vapidKey = String(process.env.VITE_FIREBASE_VAPID_KEY ?? '').trim();
  if (!apiKey || !vapidKey) return false;
  if (apiKey.toLowerCase().includes('dummy') || vapidKey === 'placeholder') {
    return false;
  }
  return true;
}

if (!isFirebaseEnabled()) {
  const stub = `// Firebase push deshabilitado (VITE_FIREBASE_ENABLED=false o sin credenciales)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
`;
  fs.writeFileSync(output, stub, 'utf8');
  console.log(`[firebase-sw] Push deshabilitado — stub en ${output}`);
  process.exit(0);
}

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Falta ${key} para generar firebase-messaging-sw.js`);
  }
}

const content = `// Generado desde .env — no editar a mano
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: ${JSON.stringify(process.env.VITE_FIREBASE_API_KEY)},
  authDomain: ${JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN)},
  projectId: ${JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID)},
  storageBucket: ${JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${JSON.stringify(process.env.VITE_FIREBASE_APP_ID)},
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Sin título';
  const notificationOptions = {
    body: payload.notification?.body || 'Sin contenido',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'firebase-notification',
    requireInteraction: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});
`;

fs.writeFileSync(output, content, 'utf8');
console.log(`[firebase-sw] Generado ${output}`);
