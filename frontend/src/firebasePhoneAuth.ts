import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

export function isFirebasePhoneConfigured() {
  return hasFirebaseConfig();
}

export function getFirebasePhoneAuth() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase phone login is not configured.');
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function requestPhoneOtp(phone: string, containerId: string): Promise<ConfirmationResult> {
  const auth = getFirebasePhoneAuth();
  const existingVerifier = (window as typeof window & { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
  if (existingVerifier) {
    existingVerifier.clear();
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  (window as typeof window & { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = verifier;

  return signInWithPhoneNumber(auth, phone, verifier);
}
