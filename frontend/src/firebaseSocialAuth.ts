import { initializeApp, getApps } from 'firebase/app';
import {
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type AuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export type SocialProviderName = 'google' | 'facebook' | 'apple';

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function getFirebaseBrowserAuth() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase social login is not configured. Add the VITE_FIREBASE_* values.');
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

function createProvider(provider: SocialProviderName): AuthProvider {
  if (provider === 'google') {
    const instance = new GoogleAuthProvider();
    instance.addScope('email');
    instance.addScope('profile');
    instance.setCustomParameters({ prompt: 'select_account' });
    return instance;
  }

  if (provider === 'facebook') {
    const instance = new FacebookAuthProvider();
    instance.addScope('email');
    return instance;
  }

  const instance = new OAuthProvider('apple.com');
  instance.addScope('email');
  instance.addScope('name');
  return instance;
}

export async function signInWithSocialProvider(provider: SocialProviderName) {
  const auth = getFirebaseBrowserAuth();
  const result = await signInWithPopup(auth, createProvider(provider));
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    provider,
    email: result.user.email || '',
    name: result.user.displayName || '',
    phone: result.user.phoneNumber || '',
  };
}
