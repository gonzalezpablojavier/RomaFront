/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_DISTRI_API: string;
  readonly VITE_IMAGE_DOMAIN: string;
  readonly VITE_IMAGE_PUBLIC_BASE_PATH?: string;
  readonly VITE_DEFAULT_USER_PHOTO_PATH?: string;
  readonly VITE_CERTIFICADOS_FILES_BASE_URL: string;
  readonly VITE_NAPSIS_LOGIN_URL: string;
  readonly VITE_QR_HOME_URL: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
