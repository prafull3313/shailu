import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { ensureAnonymousAuth, getFirestoreDb } from './firebase';

export type Entry = {
  money: number;
  from: string;
};

export type DayData = {
  id: string;
  date: string;
  entries: Entry[];
};

type FirestoreDay = Omit<DayData, 'id'>;

const getFirebaseErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

const getReadableFirestoreError = (error: unknown) => {
  if (getFirebaseErrorCode(error) === 'permission-denied') {
    return new Error(
      'Firestore permission denied. In Firebase Console, update Firestore Database > Rules to allow authenticated reads and writes to the days collection.'
    );
  }

  return error;
};

const normalizeDay = (id: string, day: Partial<FirestoreDay>): DayData => ({
  id,
  date: day.date || '',
  entries: Array.isArray(day.entries)
    ? day.entries.map((entry) => ({
        money: Number(entry.money || 0),
        from: entry.from || ''
      }))
    : []
});

export const getDaysWithEntries = async (): Promise<DayData[]> => {
  await ensureAnonymousAuth();

  try {
    const db = getFirestoreDb();
    const daysQuery = query(collection(db, 'days'), orderBy('date', 'desc'));
    const snapshot = await getDocs(daysQuery);

    return snapshot.docs.map((dayDoc) =>
      normalizeDay(dayDoc.id, dayDoc.data() as Partial<FirestoreDay>)
    );
  } catch (error) {
    throw getReadableFirestoreError(error);
  }
};

export const saveDay = async (
  day: Omit<DayData, 'id'>,
  existingDayId?: string
) => {
  await ensureAnonymousAuth();

  try {
    const db = getFirestoreDb();

    if (existingDayId) {
      await updateDoc(doc(db, 'days', existingDayId), day);

      return {
        id: existingDayId,
        message: 'Entry saved successfully.'
      };
    }

    const dayDoc = await addDoc(collection(db, 'days'), day);

    return {
      id: dayDoc.id,
      message: 'Entry saved successfully.'
    };
  } catch (error) {
    throw getReadableFirestoreError(error);
  }
};

export const deleteDay = async (dayId: string) => {
  await ensureAnonymousAuth();

  try {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, 'days', dayId));
  } catch (error) {
    throw getReadableFirestoreError(error);
  }
};
