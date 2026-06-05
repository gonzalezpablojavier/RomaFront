import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import { EventEmitter } from 'events';
import {
  getFirebaseConfig,
  getFirebaseVapidKey,
  isFirebaseEnabled,
} from './env';

export const messageEmitter = new EventEmitter();

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;
let listenerAttached = false;

function getMessagingSafe(): Messaging | null {
  if (!isFirebaseEnabled()) {
    return null;
  }

  if (!app) {
    app = initializeApp(getFirebaseConfig());
    messaging = getMessaging(app);
  }

  if (!listenerAttached && messaging) {
    listenerAttached = true;
    onMessage(messaging, (payload) => {
      messageEmitter.emit('newNotification', payload);
    });
  }

  return messaging ?? null;
}

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  try {
    const msg = getMessagingSafe();
    if (!msg) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getToken(msg, {
        vapidKey: getFirebaseVapidKey(),
      });
    }
    return null;
  } catch (error) {
    console.error('Error al solicitar permiso Firebase:', error);
    return null;
  }
};
