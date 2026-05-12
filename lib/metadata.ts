import {
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { ensureAnonymousAuth, getFirestoreDb } from './firebase';

const RIDE_ORDER_FROM_METADATA_ID = 'rideOrderFromSuggestions';

export const defaultRideOrderFromSuggestions = [
  'Umesh Sir',
  'Motherboard',
  'Kuldeep Padade',
  'Uber',
  'Ola'
];

type RideOrderFromMetadata = {
  values?: unknown;
};

const getFirebaseErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

const getReadableMetadataError = (error: unknown) => {
  if (getFirebaseErrorCode(error) === 'permission-denied') {
    return new Error(
      'Firestore permission denied. In Firebase Console, update Firestore Database > Rules to allow authenticated reads and writes to the days and metadata collections.'
    );
  }

  return error;
};

const normalizeSuggestions = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getRideOrderFromSuggestions = async (): Promise<string[]> => {
  await ensureAnonymousAuth();

  try {
    const db = getFirestoreDb();
    const metadataRef = doc(db, 'metadata', RIDE_ORDER_FROM_METADATA_ID);
    const snapshot = await getDoc(metadataRef);

    if (!snapshot.exists()) {
      await setDoc(metadataRef, { values: defaultRideOrderFromSuggestions });
      return defaultRideOrderFromSuggestions;
    }

    const metadata = snapshot.data() as RideOrderFromMetadata;
    const suggestions = normalizeSuggestions(metadata.values);

    return suggestions.length > 0 ? suggestions : defaultRideOrderFromSuggestions;
  } catch (error) {
    throw getReadableMetadataError(error);
  }
};

export const saveRideOrderFromSuggestion = async (value: string) => {
  const suggestion = value.trim();

  if (!suggestion) {
    return;
  }

  await ensureAnonymousAuth();

  try {
    const db = getFirestoreDb();
    const metadataRef = doc(db, 'metadata', RIDE_ORDER_FROM_METADATA_ID);

    await updateDoc(metadataRef, {
      values: arrayUnion(suggestion)
    });
  } catch (error) {
    if (getFirebaseErrorCode(error) === 'not-found') {
      const db = getFirestoreDb();
      const metadataRef = doc(db, 'metadata', RIDE_ORDER_FROM_METADATA_ID);

      await setDoc(metadataRef, {
        values: [...defaultRideOrderFromSuggestions, suggestion]
      });
      return;
    }

    throw getReadableMetadataError(error);
  }
};
