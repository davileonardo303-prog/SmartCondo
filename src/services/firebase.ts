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
  ItemCompartilhado,
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

// Clean object to remove undefined values before sending to Firestore
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Helper methods for Firebase Sync
export async function syncCondominioToFirestore(condo: Condominio): Promise<void> {
  const path = `condominios/${condo.id}`;
  try {
    const data = cleanFirestoreData(condo);
    await setDoc(doc(db, 'condominios', condo.id), data, { merge: true });
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
    const data = cleanFirestoreData(user);
    await setDoc(doc(db, 'usuariosSistema', user.id), data, { merge: true });
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
    const data = cleanFirestoreData(morador);
    await setDoc(doc(db, 'condominios', morador.condominioId, 'moradores', morador.id), data, {
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
    const data = cleanFirestoreData(bike);
    await setDoc(doc(db, 'condominios', bike.condominioId, 'bikes', bike.id), data, {
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
    const data = cleanFirestoreData(area);
    await setDoc(doc(db, 'condominios', area.condominioId, 'areasLazer', area.id), data, {
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
    const data = cleanFirestoreData(aviso);
    await setDoc(doc(db, 'condominios', aviso.condominioId, 'avisos', aviso.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncReservaToFirestore(reserva: Reserva): Promise<void> {
  const path = `condominios/${reserva.condominioId}/reservas/${reserva.id}`;
  try {
    const data = cleanFirestoreData(reserva);
    await setDoc(doc(db, 'condominios', reserva.condominioId, 'reservas', reserva.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncEncomendaToFirestore(encomenda: Encomenda): Promise<void> {
  const path = `condominios/${encomenda.condominioId}/encomendas/${encomenda.id}`;
  try {
    const data = cleanFirestoreData(encomenda);
    await setDoc(doc(db, 'condominios', encomenda.condominioId, 'encomendas', encomenda.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCobrancaToFirestore(cobranca: CobrancaCondominio): Promise<void> {
  const path = `cobrancas/${cobranca.id}`;
  try {
    const data = cleanFirestoreData(cobranca);
    await setDoc(doc(db, 'cobrancas', cobranca.id), data, {
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
    const data = cleanFirestoreData(config);
    await setDoc(doc(db, 'planosConfig', planoKey), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncItemCompartilhadoToFirestore(item: ItemCompartilhado): Promise<void> {
  const path = `condominios/${item.condominioId}/itens_compartilhados/${item.id}`;
  try {
    const data = cleanFirestoreData(item);
    await setDoc(doc(db, 'condominios', item.condominioId, 'itens_compartilhados', item.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteItemCompartilhadoFromFirestore(condoId: string, itemId: string): Promise<void> {
  const path = `condominios/${condoId}/itens_compartilhados/${itemId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'itens_compartilhados', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loginWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}


