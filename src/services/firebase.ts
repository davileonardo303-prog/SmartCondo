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
  FuncionarioEquipe,
  VisitanteLiberado,
  InterfoneMensagem,
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

export async function deleteEncomendaFromFirestore(condoId: string, encomendaId: string): Promise<void> {
  const path = `condominios/${condoId}/encomendas/${encomendaId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'encomendas', encomendaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function limparSubcolecaoFirestore(condoId: string, subcolecao: string): Promise<void> {
  try {
    const colRef = collection(db, 'condominios', condoId, subcolecao);
    const snap = await getDocs(colRef);
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log(`[Firestore] Subcoleção '${subcolecao}' do condomínio '${condoId}' foi limpa.`);
  } catch (err) {
    console.warn(`[Firestore] Aviso ao limpar subcoleção ${subcolecao} de ${condoId}:`, err);
  }
}

export async function limparBikesEncomendasFerramentasFirestore(condoIds: string[] = []): Promise<void> {
  const allIds = new Set<string>(condoIds.filter(Boolean));
  try {
    const condosSnap = await getDocs(collection(db, 'condominios'));
    condosSnap.forEach((docSnap) => allIds.add(docSnap.id));
  } catch (err) {
    console.warn('[Firestore] Aviso ao listar condomínios para limpeza:', err);
  }

  if (allIds.size === 0) {
    allIds.add('condo_park_avenue');
  }

  for (const condoId of allIds) {
    await limparSubcolecaoFirestore(condoId, 'encomendas');
    await limparSubcolecaoFirestore(condoId, 'bikes');
    await limparSubcolecaoFirestore(condoId, 'itens_compartilhados');
    await limparSubcolecaoFirestore(condoId, 'historicoLocacoes');
  }
}

export async function syncFuncionarioToFirestore(condoId: string, func: FuncionarioEquipe): Promise<void> {
  const path = `condominios/${condoId}/funcionarios/${func.id}`;
  try {
    const data = cleanFirestoreData(func);
    await setDoc(doc(db, 'condominios', condoId, 'funcionarios', func.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFuncionarioFromFirestore(condoId: string, funcId: string): Promise<void> {
  const path = `condominios/${condoId}/funcionarios/${funcId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'funcionarios', funcId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function limparFuncionariosFirestore(condoIds: string[] = []): Promise<void> {
  const allIds = new Set<string>(condoIds.filter(Boolean));
  try {
    const condosSnap = await getDocs(collection(db, 'condominios'));
    condosSnap.forEach((docSnap) => allIds.add(docSnap.id));
  } catch (err) {
    console.warn('[Firestore] Aviso ao listar condomínios para limpeza:', err);
  }
  for (const condoId of allIds) {
    await limparSubcolecaoFirestore(condoId, 'funcionarios');
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

export async function syncVisitanteToFirestore(visitante: VisitanteLiberado): Promise<void> {
  const path = `condominios/${visitante.condominioId}/visitantes/${visitante.id}`;
  try {
    const data = cleanFirestoreData(visitante);
    await setDoc(doc(db, 'condominios', visitante.condominioId, 'visitantes', visitante.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVisitanteFromFirestore(condoId: string, visitanteId: string): Promise<void> {
  const path = `condominios/${condoId}/visitantes/${visitanteId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'visitantes', visitanteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncInterfoneToFirestore(msg: InterfoneMensagem): Promise<void> {
  const path = `condominios/${msg.condominioId}/interfone/${msg.id}`;
  try {
    const data = cleanFirestoreData(msg);
    await setDoc(doc(db, 'condominios', msg.condominioId, 'interfone', msg.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInterfoneFromFirestore(condoId: string, msgId: string): Promise<void> {
  const path = `condominios/${condoId}/interfone/${msgId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'interfone', msgId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncNotificacaoToFirestore(notif: AppNotification): Promise<void> {
  const path = `condominios/${notif.condominioId}/notificacoes/${notif.id}`;
  try {
    const data = cleanFirestoreData(notif);
    await setDoc(doc(db, 'condominios', notif.condominioId, 'notificacoes', notif.id), data, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNotificacaoFromFirestore(condoId: string, notifId: string): Promise<void> {
  const path = `condominios/${condoId}/notificacoes/${notifId}`;
  try {
    await deleteDoc(doc(db, 'condominios', condoId, 'notificacoes', notifId));
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

// ==========================================
// FIREBASE CLOUD MESSAGING (WEB PUSH PWA)
// ==========================================
let messagingInstance: any = null;

export async function requestFCMToken(vapidKey?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('FCM Push Notifications não são suportadas neste navegador.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permissão de notificação não concedida pelo usuário:', permission);
      return null;
    }

    // Registra o Service Worker caso ainda não esteja ativo
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const { getMessaging, getToken } = await import('firebase/messaging');
    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }

    // Usa a VAPID Key fornecida ou padrão
    const token = await getToken(messagingInstance, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      console.log('✅ Token FCM registrado com sucesso:', token);
      localStorage.setItem('smartcondo_fcm_token', token);
      return token;
    }
  } catch (error) {
    console.warn('Nota sobre FCM Push Token (PWA):', error);
  }

  return null;
}

export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'fcmTokens', userId),
      {
        userId,
        token,
        updatedAt: Date.now(),
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
      },
      { merge: true }
    );
    console.log(`✅ Token FCM salvo no Firestore para o usuário ${userId}`);
  } catch (error) {
    console.warn('Erro ao salvar token FCM no Firestore:', error);
  }
}

// ==========================================
// CHAMADAS EM TEMPO REAL (FIRESTORE SIGNALING)
// ==========================================
export async function saveChamadaToFirestore(
  condominioId: string,
  chamada: {
    id: string;
    origemId?: string;
    origemNome: string;
    origemTipo: 'portaria' | 'sindico' | 'morador' | 'super_admin';
    origemUnidade?: string;
    destinoId?: string;
    destinoNome?: string;
    destinoTipo?: 'portaria' | 'sindico' | 'morador';
    destinoUnidade?: string;
    tipoMidia: 'audio' | 'video';
    status: 'chamando' | 'em_andamento' | 'finalizada' | 'recusada';
    criadoEm?: number;
  }
): Promise<void> {
  const path = `condominios/${condominioId}/chamadas/${chamada.id}`;
  try {
    const rawData = {
      ...chamada,
      criadoEm: chamada.criadoEm || Date.now(),
    };
    const data = cleanFirestoreData(rawData);
    await setDoc(
      doc(db, 'condominios', condominioId, 'chamadas', chamada.id),
      data,
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateChamadaStatusInFirestore(
  condominioId: string,
  chamadaId: string,
  status: 'chamando' | 'em_andamento' | 'finalizada' | 'recusada'
): Promise<void> {
  try {
    const rawData = {
      status,
      atualizadoEm: Date.now(),
    };
    const data = cleanFirestoreData(rawData);
    await updateDoc(doc(db, 'condominios', condominioId, 'chamadas', chamadaId), data);
  } catch (error) {
    // Documento pode já ter sido excluído ou não sincronizado
  }
}

export function listenChamadasFromFirestore(
  condominioId: string,
  callback: (chamadas: any[]) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'condominios', condominioId, 'chamadas');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id });
        });
        callback(list);
      },
      (error) => {
        console.warn('Erro ao escutar chamadas no Firestore:', error);
      }
    );
  } catch (err) {
    console.warn('Falha no listener de chamadas:', err);
    return () => {};
  }
}

export async function deleteChamadaFromFirestore(
  condominioId: string,
  chamadaId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'condominios', condominioId, 'chamadas', chamadaId));
  } catch {
    // Ignora
  }
}




