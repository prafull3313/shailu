import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export const isFirebaseConfigured = () => hasFirebaseConfig;

export const getFirestoreDb = () => {
  if (!hasFirebaseConfig) {
    throw new Error(
      'Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* values before using the app.'
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  return getFirestore(app);
};

export const getFirebaseAuth = () => {
  if (!hasFirebaseConfig) {
    throw new Error(
      'Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* values before using the app.'
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  return getAuth(app);
};

export const ensureAnonymousAuth = async () => {
  const auth = getFirebaseAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const credential = await signInAnonymously(auth);

    return credential.user;
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';

    if (code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase Anonymous Auth is not enabled. In Firebase Console, open Authentication > Sign-in method and enable Anonymous for this project.'
      );
    }

    throw error;
  }
};
