function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return String(value).trim();
}

function envOr(name: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[name];
  return value ? String(value).trim() : fallback;
}

export function getApiUrl(): string {
  return requireEnv('VITE_API_DISTRI_API').replace(/\/$/, '');
}

export function getImageDomain(): string {
  return requireEnv('VITE_IMAGE_DOMAIN').replace(/\/$/, '');
}

export function getImagePublicBasePath(): string {
  return envOr('VITE_IMAGE_PUBLIC_BASE_PATH', '/remote/path');
}

export function getDefaultUserPhotoUrl(): string {
  const path = envOr('VITE_DEFAULT_USER_PHOTO_PATH', '/images_rrhh/user-4250.png');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getImageDomain()}${normalized}`;
}

export function getCertificadosFilesBaseUrl(): string {
  return requireEnv('VITE_CERTIFICADOS_FILES_BASE_URL').replace(/\/$/, '');
}

export function buildCertificadoViewUrl(rutaArchivo: string): string {
  const basePath = getImagePublicBasePath().replace(/\/$/, '');
  const file = rutaArchivo.replace(/^\/+/, '');
  return `${getImageDomain()}${basePath}/${file}`;
}

export function buildCertificadoAdminUrl(rutaArchivo: string): string {
  return rutaArchivo.replace('/external-files', getCertificadosFilesBaseUrl());
}

export function getNapsisLoginUrl(): string {
  return requireEnv('VITE_NAPSIS_LOGIN_URL');
}

export function getQrHomeUrl(): string {
  return requireEnv('VITE_QR_HOME_URL');
}

export function isFirebaseEnabled(): boolean {
  const flag = envOr('VITE_FIREBASE_ENABLED', '').toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'no') {
    return false;
  }
  if (flag === 'true' || flag === '1' || flag === 'yes') {
    return true;
  }

  const apiKey = String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim();
  const vapidKey = String(import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '').trim();
  if (!apiKey || !vapidKey) {
    return false;
  }
  if (
    apiKey.toLowerCase().includes('dummy') ||
    vapidKey === 'placeholder'
  ) {
    return false;
  }

  return true;
}

export function getFirebaseConfig() {
  return {
    apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('VITE_FIREBASE_APP_ID'),
  };
}

export function getFirebaseVapidKey(): string {
  return requireEnv('VITE_FIREBASE_VAPID_KEY');
}
