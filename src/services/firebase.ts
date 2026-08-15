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
  Unsubscribe,
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
  UsuarioSistema,
  CobrancaCondominio,
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

export async function deleteCondominioFromFirestore(condoId: string): Promise<void> {
  const path = `condominios/${condoId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncUsuarioSistemaToFirestore(user: UsuarioSistema): Promise<void> {
  const path = `usuariosSistema/${user.id}`;
  try {
    await setDoc(doc(db, 'usuariosSistema', user.id), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUsuarioSistemaFromFirestore(userId: string): Promise<void> {
  const path = `usuariosSistema/${userId}`;
  try {
    await deleteDoc(doc(db, 'usuariosSistema', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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

export async function deleteMoradorFromFirestore(condoId: string, moradorId: string): Promise<void> {
  const path = `condominios/${condoId}/moradores/${moradorId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'moradores', moradorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncBikeToFirestore(bike: Bicicleta): Promise<void> {
  const path = `condominios/${bike.condominioId}/bikes/${bike.id}`;
  try {
    await setDoc(doc(db, 'condominios', bike.condominioId, 'bikes', bike.id), bike, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBikeFromFirestore(condoId: string, bikeId: string): Promise<void> {
  const path = `condominios/${condoId}/bikes/${bikeId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'bikes', bikeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAreaLazerToFirestore(area: AreaLazer): Promise<void> {
  const path = `condominios/${area.condominioId}/areasLazer/${area.id}`;
  try {
    await setDoc(doc(db, 'condominios', area.condominioId, 'areasLazer', area.id), area, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAreaLazerFromFirestore(condoId: string, areaId: string): Promise<void> {
  const path = `condominios/${condoId}/areasLazer/${areaId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'areasLazer', areaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAvisoToFirestore(aviso: Aviso): Promise<void> {
  const path = `condominios/${aviso.condominioId}/avisos/${aviso.id}`;
  try {
    await setDoc(doc(db, 'condominios', aviso.condominioId, 'avisos', aviso.id), aviso, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncReservaToFirestore(reserva: Reserva): Promise<void> {
  const path = `condominios/${reserva.condominioId}/reservas/${reserva.id}`;
  try {
    await setDoc(doc(db, 'condominios', reserva.condominioId, 'reservas', reserva.id), reserva, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncEncomendaToFirestore(encomenda: Encomenda): Promise<void> {
  const path = `condominios/${encomenda.condominioId}/encomendas/${encomenda.id}`;
  try {
    await setDoc(doc(db, 'condominios', encomenda.condominioId, 'encomendas', encomenda.id), encomenda, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCobrancaToFirestore(cobranca: CobrancaCondominio): Promise<void> {
  const path = `cobrancas/${cobranca.id}`;
  try {
    await setDoc(doc(db, 'cobrancas', cobranca.id), cobranca, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCobrancaFromFirestore(cobrancaId: string): Promise<void> {
  const path = `cobrancas/${cobrancaId}`;
  try {
    await deleteDoc(doc(db, 'cobrancas', cobrancaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncPlanoConfigToFirestore(planoKey: string, config: any): Promise<void> {
  const path = `planosConfig/${planoKey}`;
  try {
    await setDoc(doc(db, 'planosConfig', planoKey), config, { merge: true });
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


