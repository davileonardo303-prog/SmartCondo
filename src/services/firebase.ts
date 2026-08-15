import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Condominio,
  Morador,
  Bicicleta,
  Encomenda,
  AreaLazer,
  Reserva,
  Aviso,
  HistoricoLocacao,
  AppNotification,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Specify the firestoreDatabaseId from the configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling according to skill
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
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

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is currently offline.');
    } else {
      console.log('Firestore connection checked:', error);
    }
    return false;
  }
}

// Helper methods for Firebase Sync
export async function syncCondominioToFirestore(condo: Condominio): Promise<void> {
  const path = `condominios/${condo.id}`;
  try {
    await setDoc(doc(db, 'condominios', condo.id), condo, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncMoradorToFirestore(morador: Morador): Promise<void> {
  const path = `condominios/${morador.condominioId}/moradores/${morador.id}`;
  try {
    await setDoc(doc(db, 'condominios', morador.condominioId, 'moradores', morador.id), morador, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loginWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}
