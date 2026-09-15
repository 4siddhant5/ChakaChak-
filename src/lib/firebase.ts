import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED,
  getPersistentCacheIndexManager,
  enablePersistentCacheIndexAutoCreation,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  getDocFromCache,
  getDocsFromCache,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  getDocFromServer,
  query,
  where,
  limit,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore targeting the designated database with persistent offline caching (IndexedDB).
// Configured with CACHE_SIZE_UNLIMITED and multi-tab coordination so partner fleet workers
// in Mumbai retain their active assignments, customer coordinates, SOP checklists, and job updates
// uninterrupted even when working in basements, elevators, or areas with fluctuating mobile signals.
const databaseId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let firestoreInstance: Firestore;

try {
  // Check browser environment with IndexedDB support
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    try {
      // Tier 1: Multi-tab persistent cache with unlimited disk quota
      firestoreInstance = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          }),
        },
        databaseId
      );
    } catch (multiTabErr) {
      console.warn('Multi-tab IndexedDB cache unavailable, falling back to single-tab persistent cache:', multiTabErr);
      // Tier 2: Single-tab persistent cache fallback with unlimited disk quota
      firestoreInstance = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager({}),
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          }),
        },
        databaseId
      );
    }

    // Enable automatic query index creation for offline fast sorting & queries
    try {
      const indexManager = getPersistentCacheIndexManager(firestoreInstance);
      if (indexManager) {
        enablePersistentCacheIndexAutoCreation(indexManager);
        console.info('Firestore persistent offline query indexing enabled successfully.');
      }
    } catch (indexErr) {
      console.warn('Persistent cache index auto-creation notice:', indexErr);
    }
  } else {
    firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
} catch (error) {
  // Gracefully fallback to standard instance if already initialized or in restricted iframe/private mode
  console.info('Firestore persistent cache initialization fallback:', error);
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const firestore: Firestore = db;

// Auto-reconnect & network sync monitoring for field workers in Mumbai
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.info('Network connectivity restored. Re-enabling Firestore cloud sync...');
    try {
      await enableNetwork(db);
      console.info('Firestore network re-enabled. Flushing queued offline mutations.');
    } catch (err) {
      console.warn('Error re-enabling Firestore network:', err);
    }
  });

  window.addEventListener('offline', () => {
    console.info('Network dropped. Operating seamlessly via persistent IndexedDB offline cache.');
  });
}

// Connection test on boot with offline resilience
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('offline') ||
        error.message.includes('unavailable'))
    ) {
      console.info('Firestore connection note: Client is operating in persistent offline cache mode.');
    }
  }
}
testConnection();

// Standardized Operation Types & Error Handler for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-in helper
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-in error:', error);
    throw error;
  }
}

// Email & Password Sign-in helper
export async function loginWithEmailAndPassword(email: string, pass: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error: any) {
    console.error('Firebase Email Sign-in error:', error);
    throw error;
  }
}

// Email & Password Sign-up helper
export async function registerWithEmailAndPassword(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    return res.user;
  } catch (error: any) {
    console.error('Firebase Registration error:', error);
    throw error;
  }
}

// Sign-out helper
export async function signOutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-out error:', error);
    throw error;
  }
}

/**
 * Recursively removes `undefined` properties because Firestore rejects undefined values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

/**
 * Flushes all pending writes to Firestore cloud and resolves once the server confirms persistence.
 * Essential for workers before ending shifts or leaving customer sites to ensure all updates reached cloud.
 */
export async function syncPendingWrites(): Promise<boolean> {
  try {
    await waitForPendingWrites(db);
    return true;
  } catch (error) {
    console.warn('Sync pending writes note:', error);
    return false;
  }
}

/**
 * Returns current browser online state
 */
export function isNetworkOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Subscribe to browser network state changes for UI indicators
 */
export function subscribeNetworkStatus(onChange: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => () => {};
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  getDocFromCache,
  getDocsFromCache,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  CACHE_SIZE_UNLIMITED,
  query,
  where,
  limit,
  orderBy,
  onAuthStateChanged,
  updateProfile,
};
export type { User };
