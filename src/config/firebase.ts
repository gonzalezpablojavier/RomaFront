import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { EventEmitter } from 'events';
import { getFirebaseConfig, getFirebaseVapidKey } from './env';

export const app = initializeApp(getFirebaseConfig());
export const messaging = getMessaging(app);
export const messageEmitter = new EventEmitter();

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: getFirebaseVapidKey(),
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error al solicitar permiso:', error);
    return null;
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
  messageEmitter.emit('newNotification', payload);
});
