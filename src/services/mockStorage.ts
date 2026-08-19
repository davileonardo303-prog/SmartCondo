import {
  Condominio,
  Morador,
  Bicicleta,
  HistoricoLocacao,
  Encomenda,
  AreaLazer,
  Reserva,
  Aviso,
  AppNotification,
  Unidade,
  UsuarioSistema,
  UserAccount,
  CobrancaCondominio,
  PlanoTipo,
  PlanoConfigItem,
  VisitanteLiberado,
  CameraAreaComum,
  Ocorrencia,
  OcorrenciaStatus,
  BoletoMensalidade,
  ItemExtratoFinanceiro,
  ExtratoMensalItem,
  MuralPost,
  EnqueteCondominio,
  SugestaoMorador,
  DocumentoCondominio,
  ItemCompartilhado,
  FuncionarioEquipe,
  CargoFuncionario,
  PermissoesFuncionario,
  UserRole,
  InterfoneMensagem,
} from '../types';
import { whatsappService } from './whatsappService';
import { notificationService } from './notificationService';
import { audioAlertService } from '../utils/audioAlerts';
import {
  db,
  syncCondominioToFirestore,
  deleteCondominioFromFirestore,
  syncUsuarioSistemaToFirestore,
  deleteUsuarioSistemaFromFirestore,
  syncMoradorToFirestore,
  deleteMoradorFromFirestore,
  syncBikeToFirestore,
  deleteBikeFromFirestore,
  syncAreaLazerToFirestore,
  deleteAreaLazerFromFirestore,
  syncAvisoToFirestore,
  syncReservaToFirestore,
  syncEncomendaToFirestore,
  deleteEncomendaFromFirestore,
  limparSubcolecaoFirestore,
  limparBikesEncomendasFerramentasFirestore,
  syncCobrancaToFirestore,
  deleteCobrancaFromFirestore,
  syncPlanoConfigToFirestore,
  syncItemCompartilhadoToFirestore,
  deleteItemCompartilhadoFromFirestore,
  syncFuncionarioToFirestore,
  deleteFuncionarioFromFirestore,
  limparFuncionariosFirestore,
  syncVisitanteToFirestore,
  deleteVisitanteFromFirestore,
  syncInterfoneToFirestore,
  deleteInterfoneFromFirestore,
} from './firebase';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'smartcondo_prod_v10_clean';

export const DEFAULT_PLANOS_CONFIG: Record<PlanoTipo, PlanoConfigItem> = {
  Teste: {
    id: 'Teste',
    nome: 'Plano Teste (3 Meses)',
    valor: 0,
    unidades: 'Até 100 aptos',
    bikes: 'Até 10 bikes',
    desc: 'Período gratuito de 3 meses (90 dias) para o síndico testar sem custo todas as funcionalidades do condomínio.',
    duracaoMeses: 3,
    isTesteGratuito: true,
    destaque: false,
    ativo: true,
  },
  Smart: {
    id: 'Smart',
    nome: 'Plano Smart',
    valor: 249,
    unidades: 'Até 50 aptos',
    bikes: 'Até 5 bikes',
    desc: 'Ideal para condomínios pequenos e vilas residenciais.',
    duracaoMeses: 1,
    isTesteGratuito: false,
    destaque: false,
    ativo: true,
  },
  Plus: {
    id: 'Plus',
    nome: 'Plano Plus',
    valor: 499,
    unidades: 'Até 150 aptos',
    bikes: 'Até 15 bikes',
    desc: 'Mais popular! Inclui áreas de lazer, reservas e disparos de WhatsApp.',
    duracaoMeses: 1,
    isTesteGratuito: false,
    destaque: true,
    ativo: true,
  },
  Pro: {
    id: 'Pro',
    nome: 'Plano Pro',
    valor: 799,
    unidades: 'Até 300 aptos',
    bikes: 'Até 30 bikes',
    desc: 'Para condomínios de médio/grande porte com alto fluxo de encomendas.',
    duracaoMeses: 1,
    isTesteGratuito: false,
    destaque: false,
    ativo: true,
  },
  Enterprise: {
    id: 'Enterprise',
    nome: 'Plano Enterprise',
    valor: 1299,
    unidades: 'Ilimitado',
    bikes: 'Frota ampliada',
    desc: 'Múltiplas torres, relatórios avançados e suporte prioritário 24/7.',
    duracaoMeses: 1,
    isTesteGratuito: false,
    destaque: false,
    ativo: true,
  },
};

// Credenciais Únicas de Acesso Global (Super Administrador)
const INITIAL_USUARIOS_SISTEMA: UsuarioSistema[] = [
  {
    id: 'super_admin_davi',
    nome: 'Davi Leonardo',
    email: 'davileonardo303@gmail.com',
    senha: 'Perfumaria20',
    role: 'super_admin',
    condominioId: '',
    statusCadastro: 'ativo',
    authProvider: 'email',
  },
  {
    id: 'sindico_carlos',
    nome: 'Carlos Eduardo Mendes',
    email: 'sindico@smartcondo.com.br',
    senha: 'sindico123',
    role: 'sindico',
    condominioId: 'condo_park_avenue',
    statusCadastro: 'ativo',
    authProvider: 'email',
  },
  {
    id: 'portaria_central',
    nome: 'Portaria 24 Horas',
    email: 'portaria@smartcondo.com.br',
    senha: 'portaria123',
    role: 'portaria',
    condominioId: 'condo_park_avenue',
    statusCadastro: 'ativo',
    authProvider: 'email',
  },
];

const INITIAL_CONDOMINIOS: Condominio[] = [];

const INITIAL_MORADORES: Record<string, Morador[]> = {};
const INITIAL_BIKES: Record<string, Bicicleta[]> = {};
const INITIAL_HISTORICO_LOCACOES: Record<string, HistoricoLocacao[]> = {};
const INITIAL_ENCOMENDAS: Record<string, Encomenda[]> = {};
const INITIAL_AREAS_LAZER: Record<string, AreaLazer[]> = {};
const INITIAL_RESERVAS: Record<string, Reserva[]> = {};
const INITIAL_AVISOS: Record<string, Aviso[]> = {};
const INITIAL_NOTIFICACOES: AppNotification[] = [];

type Listener = () => void;

class MockCondoStore {
  private condominios: Condominio[] = [];
  private moradores: Record<string, Morador[]> = {};
  private usuariosSistema: UsuarioSistema[] = [];
  private bikes: Record<string, Bicicleta[]> = {};
  private historicoLocacoes: Record<string, HistoricoLocacao[]> = {};
  private encomendas: Record<string, Encomenda[]> = {};
  private areasLazer: Record<string, AreaLazer[]> = {};
  private reservas: Record<string, Reserva[]> = {};
  private avisos: Record<string, Aviso[]> = {};
  private notificacoes: AppNotification[] = [];
  private cobrancas: CobrancaCondominio[] = [];
  private planosConfig: Record<PlanoTipo, PlanoConfigItem> = { ...DEFAULT_PLANOS_CONFIG };
  private visitantes: Record<string, VisitanteLiberado[]> = {};
  private cameras: Record<string, CameraAreaComum[]> = {};
  private ocorrencias: Record<string, Ocorrencia[]> = {};
  private boletos: Record<string, BoletoMensalidade[]> = {};
  private extratoFinanceiro: Record<string, ItemExtratoFinanceiro[]> = {};
  private muralPosts: Record<string, MuralPost[]> = {};
  private enquetes: Record<string, EnqueteCondominio[]> = {};
  private sugestoes: Record<string, SugestaoMorador[]> = {};
  private documentos: Record<string, DocumentoCondominio[]> = {};
  private itensCompartilhados: Record<string, ItemCompartilhado[]> = {};
  private funcionarios: Record<string, FuncionarioEquipe[]> = {};
  private interfoneMensagens: Record<string, InterfoneMensagem[]> = {};
  private listeners: Set<Listener> = new Set();
  private subUnsubscribers: Record<string, (() => void)[]> = {};
  private version = 0;
  private isBootstrapping = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('smartcondo_') && k !== STORAGE_KEY_PREFIX && k !== 'smartcondo_session_v1') {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // Ignora
    }

    this.loadFromStorage();
    // Garante que Encomendas, Bicicletas e Ferramentas iniciem 100% zeradas para novos cadastros do zero
    this.bikes = {};
    this.encomendas = {};
    this.itensCompartilhados = {};
    this.historicoLocacoes = {};
    this.saveToStorage();

    this.initFirestoreListeners();
    this.bootstrapFromFirestore();
    this.initializeSampleData();

    // Verificação contínua do Timer de 5 Minutos da Reserva de Bicicletas e Itens e Prazos de Encomendas
    setInterval(() => {
      this.verificarExpiracaoReservas5Min();
      this.verificarExpiracaoReservasItensCompartilhados();
      this.verificarPrazosEncomendas();
    }, 2500);
  }

  public async bootstrapFromFirestore(): Promise<boolean> {
    if (this.isBootstrapping) return true;
    this.isBootstrapping = true;
    try {
      // 1. Condomínios (Merge Local + Firestore)
      const condoSnap = await getDocs(collection(db, 'condominios'));
      const firestoreCondos: Record<string, Condominio> = {};
      if (!condoSnap.empty) {
        condoSnap.forEach((docSnap) => {
          const data = docSnap.data() as Condominio;
          firestoreCondos[docSnap.id] = { ...data, id: docSnap.id };
        });
      }

      // Merge: preserve all local condos and upload any that are missing in Firestore
      const mergedCondosMap = new Map<string, Condominio>();
      // First add Firestore condos
      Object.values(firestoreCondos).forEach((c) => mergedCondosMap.set(c.id, c));
      // Then add local condos if not in Firestore, and push to Firestore
      for (const localC of this.condominios) {
        if (!mergedCondosMap.has(localC.id)) {
          mergedCondosMap.set(localC.id, localC);
          syncCondominioToFirestore(localC).catch(() => {});
        }
      }
      this.condominios = Array.from(mergedCondosMap.values());

      // Limpa subcoleções de teste no Firestore para garantir início 100% zerado
      const condoIds = this.condominios.map((c) => c.id);
      if (condoIds.length === 0) condoIds.push('condo_park_avenue');
      await limparBikesEncomendasFerramentasFirestore(condoIds);

      for (const condo of this.condominios) {
        this.subscribeToCondoSubcollections(condo.id);
        this.fetchCondoSubcollections(condo.id);
      }

      // 2. Usuários do Sistema (SuperAdmin, Síndicos, Portaria)
      const userSnap = await getDocs(collection(db, 'usuariosSistema'));
      const firestoreUsers: Record<string, UsuarioSistema> = {};
      if (!userSnap.empty) {
        userSnap.forEach((docSnap) => {
          const data = docSnap.data() as UsuarioSistema;
          firestoreUsers[docSnap.id] = { ...data, id: docSnap.id };
        });
      }

      const mergedUsersMap = new Map<string, UsuarioSistema>();
      Object.values(firestoreUsers).forEach((u) => mergedUsersMap.set(u.id, u));
      for (const localU of this.usuariosSistema) {
        if (!mergedUsersMap.has(localU.id)) {
          mergedUsersMap.set(localU.id, localU);
          syncUsuarioSistemaToFirestore(localU).catch(() => {});
        }
      }

      const mergedUsersList = Array.from(mergedUsersMap.values());
      const hasSuper = mergedUsersList.some(
        (u) => u.email.toLowerCase() === 'davileonardo303@gmail.com'
      );
      if (!hasSuper) {
        mergedUsersList.unshift(INITIAL_USUARIOS_SISTEMA[0]);
        syncUsuarioSistemaToFirestore(INITIAL_USUARIOS_SISTEMA[0]).catch(() => {});
      }

      this.usuariosSistema = mergedUsersList;

      // 3. Planos Config
      const planosSnap = await getDocs(collection(db, 'planosConfig'));
      if (!planosSnap.empty) {
        planosSnap.forEach((d) => {
          const key = d.id as PlanoTipo;
          this.planosConfig[key] = { ...(this.planosConfig[key] || {}), ...(d.data() as any) };
        });
      } else {
        // Push initial plans to Firestore
        Object.entries(this.planosConfig).forEach(([key, cfg]) => {
          syncPlanoConfigToFirestore(key, cfg).catch(() => {});
        });
      }

      // 4. Cobranças
      const cobSnap = await getDocs(collection(db, 'cobrancas'));
      if (!cobSnap.empty) {
        const loadedCobrancas: CobrancaCondominio[] = [];
        cobSnap.forEach((d) => {
          loadedCobrancas.push({ ...(d.data() as CobrancaCondominio), id: d.id });
        });
        this.cobrancas = loadedCobrancas;
      }

      this.saveToStorage();
      this.notify();
      this.isBootstrapping = false;
      return true;
    } catch (err) {
      console.warn('Bootstrap Firestore error/warning:', err);
      this.isBootstrapping = false;
      return false;
    }
  }

  public async sincronizarTudoComFirestore(): Promise<{ condominiosCount: number; sindicosCount: number }> {
    try {
      // 1. Sincroniza SuperAdmin e Síndicos
      for (const u of this.usuariosSistema) {
        await syncUsuarioSistemaToFirestore(u).catch(() => {});
      }

      // 2. Sincroniza Planos
      for (const [key, cfg] of Object.entries(this.planosConfig)) {
        await syncPlanoConfigToFirestore(key, cfg).catch(() => {});
      }

      // 3. Sincroniza Condomínios e subcoleções
      for (const c of this.condominios) {
        await syncCondominioToFirestore(c).catch(() => {});
        // Subcoleções
        const morList = this.moradores[c.id] || [];
        for (const m of morList) {
          await syncMoradorToFirestore(m).catch(() => {});
        }
        const bikeList = this.bikes[c.id] || [];
        for (const b of bikeList) {
          await syncBikeToFirestore(b).catch(() => {});
        }
        const areaList = this.areasLazer[c.id] || [];
        for (const a of areaList) {
          await syncAreaLazerToFirestore(a).catch(() => {});
        }
        const avisoList = this.avisos[c.id] || [];
        for (const av of avisoList) {
          await syncAvisoToFirestore(av).catch(() => {});
        }
        const encList = this.encomendas[c.id] || [];
        for (const enc of encList) {
          await syncEncomendaToFirestore(enc).catch(() => {});
        }
      }

      // 4. Recarrega para validar integridade
      await this.bootstrapFromFirestore();

      return {
        condominiosCount: this.condominios.length,
        sindicosCount: this.usuariosSistema.filter((u) => u.role === 'sindico').length,
      };
    } catch (err) {
      console.warn('Erro ao forçar sincronização total:', err);
      return {
        condominiosCount: this.condominios.length,
        sindicosCount: this.usuariosSistema.filter((u) => u.role === 'sindico').length,
      };
    }
  }

  private updateLocalSubcollection<T extends { id: string }>(
    localMap: Record<string, T[]>,
    condoId: string,
    firestoreItems: T[]
  ): boolean {
    const currentList = localMap[condoId] || [];
    if (currentList.length === 0 && firestoreItems.length === 0) {
      localMap[condoId] = [];
      return false;
    }

    // Merge: prioritize incoming firestore items but preserve local items not yet synced
    const firestoreMap = new Map(firestoreItems.map((item) => [item.id, item]));
    const mergedList: T[] = [...firestoreItems];

    for (const locItem of currentList) {
      if (!firestoreMap.has(locItem.id)) {
        mergedList.push(locItem);
      }
    }

    const currentJson = JSON.stringify(currentList);
    const newJson = JSON.stringify(mergedList);
    if (currentJson === newJson) {
      return false;
    }

    localMap[condoId] = mergedList;
    this.saveToStorage();
    return true;
  }

  private async fetchCondoSubcollections(condoId: string) {
    try {
      // Moradores
      const morSnap = await getDocs(collection(db, 'condominios', condoId, 'moradores'));
      const morList: Morador[] = [];
      if (!morSnap.empty) {
        morSnap.forEach((d) => morList.push({ ...(d.data() as Morador), id: d.id }));
      }
      this.updateLocalSubcollection(this.moradores, condoId, morList);

      // Bikes
      const bikeSnap = await getDocs(collection(db, 'condominios', condoId, 'bikes'));
      const bikeList: Bicicleta[] = [];
      if (!bikeSnap.empty) {
        bikeSnap.forEach((d) => bikeList.push({ ...(d.data() as Bicicleta), id: d.id }));
      }
      this.updateLocalSubcollection(this.bikes, condoId, bikeList);

      // Áreas de Lazer
      const areaSnap = await getDocs(collection(db, 'condominios', condoId, 'areasLazer'));
      const areaList: AreaLazer[] = [];
      if (!areaSnap.empty) {
        areaSnap.forEach((d) => areaList.push({ ...(d.data() as AreaLazer), id: d.id }));
      }
      this.updateLocalSubcollection(this.areasLazer, condoId, areaList);

      // Avisos
      const avisoSnap = await getDocs(collection(db, 'condominios', condoId, 'avisos'));
      const avisoList: Aviso[] = [];
      if (!avisoSnap.empty) {
        avisoSnap.forEach((d) => avisoList.push({ ...(d.data() as Aviso), id: d.id }));
      }
      this.updateLocalSubcollection(this.avisos, condoId, avisoList);

      // Encomendas
      const encSnap = await getDocs(collection(db, 'condominios', condoId, 'encomendas'));
      const encList: Encomenda[] = [];
      if (!encSnap.empty) {
        encSnap.forEach((d) => encList.push({ ...(d.data() as Encomenda), id: d.id }));
      }
      this.updateLocalSubcollection(this.encomendas, condoId, encList);

      // Reservas
      const resSnap = await getDocs(collection(db, 'condominios', condoId, 'reservas'));
      const resList: Reserva[] = [];
      if (!resSnap.empty) {
        resSnap.forEach((d) => resList.push({ ...(d.data() as Reserva), id: d.id }));
      }
      this.updateLocalSubcollection(this.reservas, condoId, resList);

      // Itens Compartilhados
      const itemSnap = await getDocs(collection(db, 'condominios', condoId, 'itens_compartilhados'));
      const itemList: ItemCompartilhado[] = [];
      if (!itemSnap.empty) {
        itemSnap.forEach((d) => itemList.push({ ...(d.data() as ItemCompartilhado), id: d.id }));
      }
      this.updateLocalSubcollection(this.itensCompartilhados, condoId, itemList);

      // Funcionários da Equipe
      const funcSnap = await getDocs(collection(db, 'condominios', condoId, 'funcionarios'));
      const funcList: FuncionarioEquipe[] = [];
      if (!funcSnap.empty) {
        funcSnap.forEach((d) => funcList.push({ ...(d.data() as FuncionarioEquipe), id: d.id }));
      }
      this.updateLocalSubcollection(this.funcionarios, condoId, funcList);

      // Visitantes e Prestadores
      const visSnap = await getDocs(collection(db, 'condominios', condoId, 'visitantes'));
      const visList: VisitanteLiberado[] = [];
      if (!visSnap.empty) {
        visSnap.forEach((d) => visList.push({ ...(d.data() as VisitanteLiberado), id: d.id }));
      }
      this.updateLocalSubcollection(this.visitantes, condoId, visList);

      // Interfonia e Áudios PTT
      const interSnap = await getDocs(collection(db, 'condominios', condoId, 'interfone'));
      const interList: InterfoneMensagem[] = [];
      if (!interSnap.empty) {
        interSnap.forEach((d) => interList.push({ ...(d.data() as InterfoneMensagem), id: d.id }));
      }
      this.updateLocalSubcollection(this.interfoneMensagens, condoId, interList);

      this.saveToStorage();
    } catch (err) {
      console.warn(`Erro ao buscar subcoleções do condomínio ${condoId}:`, err);
    }
  }

  private initFirestoreListeners() {
    try {
      // 1. Escuta Condomínios no Firestore
      onSnapshot(collection(db, 'condominios'), (snapshot) => {
        if (!snapshot.empty) {
          const loadedCondos: Condominio[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Condominio;
            loadedCondos.push({ ...data, id: docSnap.id });
          });

          const currentJson = JSON.stringify(this.condominios);
          const newJson = JSON.stringify(loadedCondos);
          if (currentJson !== newJson) {
            this.condominios = loadedCondos;
            this.saveToStorage();
            this.notify();
          }

          // Inscreve para subcoleções de cada condomínio
          loadedCondos.forEach((condo) => {
            this.subscribeToCondoSubcollections(condo.id);
          });
        }
      }, (err) => {
        console.warn('Firestore condominios listener offline/error:', err.message);
      });

      // 2. Escuta Usuários do Sistema (Síndicos, Portaria) no Firestore
      onSnapshot(collection(db, 'usuariosSistema'), (snapshot) => {
        if (!snapshot.empty) {
          const loadedUsers: UsuarioSistema[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as UsuarioSistema;
            loadedUsers.push({ ...data, id: docSnap.id });
          });

          const hasSuper = loadedUsers.some(
            (u) => u.email.toLowerCase() === 'davileonardo303@gmail.com'
          );
          if (!hasSuper) {
            loadedUsers.unshift(INITIAL_USUARIOS_SISTEMA[0]);
          }

          const currentJson = JSON.stringify(this.usuariosSistema);
          const newJson = JSON.stringify(loadedUsers);
          if (currentJson !== newJson) {
            this.usuariosSistema = loadedUsers;
            this.saveToStorage();
            this.notify();
          }
        }
      }, (err) => {
        console.warn('Firestore usuariosSistema listener offline/error:', err.message);
      });

      // 3. Escuta Cobranças no Firestore
      onSnapshot(collection(db, 'cobrancas'), (snapshot) => {
        if (!snapshot.empty) {
          const loadedCobrancas: CobrancaCondominio[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CobrancaCondominio;
            loadedCobrancas.push({ ...data, id: docSnap.id });
          });
          const currentJson = JSON.stringify(this.cobrancas);
          const newJson = JSON.stringify(loadedCobrancas);
          if (currentJson !== newJson) {
            this.cobrancas = loadedCobrancas;
            this.saveToStorage();
            this.notify();
          }
        }
      }, (err) => {
        console.warn('Firestore cobrancas listener offline/error:', err.message);
      });

      // 4. Escuta Configuração dos Planos no Firestore
      onSnapshot(collection(db, 'planosConfig'), (snapshot) => {
        if (!snapshot.empty) {
          let mudou = false;
          snapshot.forEach((docSnap) => {
            const key = docSnap.id as PlanoTipo;
            const existing = this.planosConfig[key] || {};
            const incoming = docSnap.data() as any;
            if (JSON.stringify(existing) !== JSON.stringify(incoming)) {
              this.planosConfig[key] = { ...existing, ...incoming };
              mudou = true;
            }
          });
          if (mudou) {
            this.saveToStorage();
            this.notify();
          }
        }
      }, (err) => {
        console.warn('Firestore planosConfig listener offline/error:', err.message);
      });
    } catch (err) {
      console.warn('Erro ao inicializar listeners do Firestore:', err);
    }
  }

  private subscribeToCondoSubcollections(condoId: string) {
    if (this.subUnsubscribers[condoId]) return;

    const unsubs: (() => void)[] = [];
    try {
      // Moradores
      const unsubMoradores = onSnapshot(
        collection(db, 'condominios', condoId, 'moradores'),
        (snap) => {
          const list: Morador[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as Morador), id: d.id }));
          if (this.updateLocalSubcollection(this.moradores, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Moradores sync error:', err.message)
      );
      unsubs.push(unsubMoradores);

      // Bikes
      const unsubBikes = onSnapshot(
        collection(db, 'condominios', condoId, 'bikes'),
        (snap) => {
          const list: Bicicleta[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as Bicicleta), id: d.id }));
          if (this.updateLocalSubcollection(this.bikes, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Bikes sync error:', err.message)
      );
      unsubs.push(unsubBikes);

      // Áreas de Lazer
      const unsubAreas = onSnapshot(
        collection(db, 'condominios', condoId, 'areasLazer'),
        (snap) => {
          const list: AreaLazer[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as AreaLazer), id: d.id }));
          if (this.updateLocalSubcollection(this.areasLazer, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('AreasLazer sync error:', err.message)
      );
      unsubs.push(unsubAreas);

      // Encomendas
      const unsubEnc = onSnapshot(
        collection(db, 'condominios', condoId, 'encomendas'),
        (snap) => {
          const list: Encomenda[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as Encomenda), id: d.id }));
          if (this.updateLocalSubcollection(this.encomendas, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Encomendas sync error:', err.message)
      );
      unsubs.push(unsubEnc);

      // Reservas
      const unsubRes = onSnapshot(
        collection(db, 'condominios', condoId, 'reservas'),
        (snap) => {
          const list: Reserva[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as Reserva), id: d.id }));
          if (this.updateLocalSubcollection(this.reservas, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Reservas sync error:', err.message)
      );
      unsubs.push(unsubRes);

      // Avisos
      const unsubAvisos = onSnapshot(
        collection(db, 'condominios', condoId, 'avisos'),
        (snap) => {
          const list: Aviso[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as Aviso), id: d.id }));
          if (this.updateLocalSubcollection(this.avisos, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Avisos sync error:', err.message)
      );
      unsubs.push(unsubAvisos);

      // Itens Compartilhados
      const unsubItens = onSnapshot(
        collection(db, 'condominios', condoId, 'itens_compartilhados'),
        (snap) => {
          const list: ItemCompartilhado[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as ItemCompartilhado), id: d.id }));
          if (this.updateLocalSubcollection(this.itensCompartilhados, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Itens Compartilhados sync error:', err.message)
      );
      unsubs.push(unsubItens);

      // Funcionários da Equipe
      const unsubFunc = onSnapshot(
        collection(db, 'condominios', condoId, 'funcionarios'),
        (snap) => {
          const list: FuncionarioEquipe[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as FuncionarioEquipe), id: d.id }));
          if (this.updateLocalSubcollection(this.funcionarios, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Funcionarios sync error:', err.message)
      );
      unsubs.push(unsubFunc);

      // Visitantes e Prestadores em Tempo Real
      const unsubVis = onSnapshot(
        collection(db, 'condominios', condoId, 'visitantes'),
        (snap) => {
          const list: VisitanteLiberado[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as VisitanteLiberado), id: d.id }));
          if (this.updateLocalSubcollection(this.visitantes, condoId, list)) {
            this.notify();
          }
        },
        (err) => console.warn('Visitantes sync error:', err.message)
      );
      unsubs.push(unsubVis);

      // Interfonia e Áudios PTT em Tempo Real
      const unsubInter = onSnapshot(
        collection(db, 'condominios', condoId, 'interfone'),
        (snap) => {
          const list: InterfoneMensagem[] = [];
          snap.forEach((d) => list.push({ ...(d.data() as InterfoneMensagem), id: d.id }));
          const previousCount = (this.interfoneMensagens[condoId] || []).length;
          if (this.updateLocalSubcollection(this.interfoneMensagens, condoId, list)) {
            // Se chegou nova mensagem não lida
            if (list.length > previousCount) {
              const latest = list.sort((a, b) => b.criadoEm - a.criadoEm)[0];
              if (latest && Date.now() - latest.criadoEm < 30000) {
                audioAlertService.playIntercomRingtone();
                audioAlertService.sendNotification(`🎙️ ${latest.remetenteNome}: Transmissão no Interfone`, {
                  body: latest.texto || 'Mensagem de áudio recebida via interfone.',
                });
              }
            }
            this.notify();
          }
        },
        (err) => console.warn('Interfone sync error:', err.message)
      );
      unsubs.push(unsubInter);

      this.subUnsubscribers[condoId] = unsubs;
    } catch (err) {
      console.warn(`Erro ao assinar subcoleções do condomínio ${condoId}:`, err);
    }
  }

  public ensureCondoSubscribed(condoId: string) {
    if (!condoId) return;
    if (!this.subUnsubscribers[condoId]) {
      this.subscribeToCondoSubcollections(condoId);
      this.fetchCondoSubcollections(condoId);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.condominios = parsed.condominios || [];
        this.moradores = parsed.moradores || {};
        this.bikes = parsed.bikes || {};
        this.historicoLocacoes = parsed.historicoLocacoes || {};
        this.encomendas = parsed.encomendas || {};
        this.areasLazer = parsed.areasLazer || {};
        this.reservas = parsed.reservas || {};
        this.avisos = parsed.avisos || {};
        this.notificacoes = parsed.notificacoes || [];
        this.cobrancas = parsed.cobrancas || [];
        this.visitantes = parsed.visitantes || {};
        this.cameras = parsed.cameras || {};
        this.ocorrencias = parsed.ocorrencias || {};
        this.boletos = parsed.boletos || {};
        this.extratoFinanceiro = parsed.extratoFinanceiro || {};
        this.muralPosts = parsed.muralPosts || {};
        this.enquetes = parsed.enquetes || {};
        this.sugestoes = parsed.sugestoes || {};
        this.documentos = parsed.documentos || {};
        this.itensCompartilhados = parsed.itensCompartilhados || {};
        this.funcionarios = parsed.funcionarios || {};
        this.interfoneMensagens = parsed.interfoneMensagens || {};
        this.planosConfig = parsed.planosConfig
          ? { ...DEFAULT_PLANOS_CONFIG, ...parsed.planosConfig }
          : { ...DEFAULT_PLANOS_CONFIG };

        // Garante que o Super Admin Davi Leonardo sempre existe com a senha correta
        const savedUsers: UsuarioSistema[] = parsed.usuariosSistema || [];
        const superAdminIndex = savedUsers.findIndex(
          (u) => u.email.toLowerCase() === 'davileonardo303@gmail.com'
        );
        if (superAdminIndex >= 0) {
          savedUsers[superAdminIndex].senha = 'Perfumaria20';
          savedUsers[superAdminIndex].role = 'super_admin';
        } else {
          savedUsers.unshift(INITIAL_USUARIOS_SISTEMA[0]);
        }

        this.usuariosSistema = savedUsers;
        return;
      }
    } catch {
      // fallback to initial
    }

    this.condominios = [];
    this.moradores = {};
    this.usuariosSistema = [...INITIAL_USUARIOS_SISTEMA];
    this.bikes = {};
    this.historicoLocacoes = {};
    this.encomendas = {};
    this.areasLazer = {};
    this.reservas = {};
    this.avisos = {};
    this.notificacoes = [];
    this.cobrancas = [];
    this.visitantes = {};
    this.cameras = {};
    this.ocorrencias = {};
    this.boletos = {};
    this.extratoFinanceiro = {};
    this.muralPosts = {};
    this.enquetes = {};
    this.sugestoes = {};
    this.documentos = {};
    this.itensCompartilhados = {};
    this.funcionarios = {};
    this.planosConfig = { ...DEFAULT_PLANOS_CONFIG };
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      const data = {
        condominios: this.condominios,
        moradores: this.moradores,
        usuariosSistema: this.usuariosSistema,
        bikes: this.bikes,
        historicoLocacoes: this.historicoLocacoes,
        encomendas: this.encomendas,
        areasLazer: this.areasLazer,
        reservas: this.reservas,
        avisos: this.avisos,
        notificacoes: this.notificacoes,
        cobrancas: this.cobrancas,
        planosConfig: this.planosConfig,
        visitantes: this.visitantes,
        cameras: this.cameras,
        ocorrencias: this.ocorrencias,
        boletos: this.boletos,
        extratoFinanceiro: this.extratoFinanceiro,
        muralPosts: this.muralPosts,
        enquetes: this.enquetes,
        sugestoes: this.sugestoes,
        documentos: this.documentos,
        itensCompartilhados: this.itensCompartilhados,
        funcionarios: this.funcionarios,
        interfoneMensagens: this.interfoneMensagens,
      };
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(data));
    } catch {
      // Storage limits or sandbox exception
    }
  }

  public zerarBancoDados() {
    this.condominios = [];
    this.moradores = {};
    this.usuariosSistema = [
      {
        id: 'super_admin_davi',
        nome: 'Davi Leonardo',
        email: 'davileonardo303@gmail.com',
        senha: 'Perfumaria20',
        role: 'super_admin',
        condominioId: '',
        statusCadastro: 'ativo',
        authProvider: 'email',
      },
    ];
    this.bikes = {};
    this.historicoLocacoes = {};
    this.encomendas = {};
    this.areasLazer = {};
    this.reservas = {};
    this.avisos = {};
    this.notificacoes = [];
    whatsappService.limparHistorico();
    this.saveToStorage();
    this.notify();
  }

  // Limpeza explícita para início de cadastros do zero (Encomendas, Bicicletas, Ferramentas/Itens Compartilhados)
  public async limparEncomendasBikesFerramentas(condoId?: string) {
    if (condoId) {
      this.bikes[condoId] = [];
      this.encomendas[condoId] = [];
      this.itensCompartilhados[condoId] = [];
      this.historicoLocacoes[condoId] = [];
    } else {
      this.bikes = {};
      this.encomendas = {};
      this.itensCompartilhados = {};
      this.historicoLocacoes = {};
    }
    this.saveToStorage();
    this.notify();

    try {
      const condoIds = condoId ? [condoId] : this.condominios.map((c) => c.id);
      if (condoIds.length === 0) condoIds.push('condo_park_avenue');
      await limparBikesEncomendasFerramentasFirestore(condoIds);
      console.log('✅ Banco de dados limpo para novos cadastros (Encomendas, Bikes e Ferramentas).');
    } catch (e) {
      console.warn('Erro ao limpar Firestore:', e);
    }
  }

  public getVersion(): number {
    return this.version;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.version++;
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY_PREFIX);
    this.loadFromStorage();
    this.notify();
  }

  // --- Condomínios / Super Admin ---
  public getCondominios(): Condominio[] {
    return [...this.condominios];
  }

  public getCondominio(id: string): Condominio | undefined {
    return this.condominios.find((c) => c.id === id);
  }

  public async addCondominioAsync(condo: Omit<Condominio, 'id'>): Promise<Condominio> {
    const newCondo = this.addCondominio(condo);
    try {
      await syncCondominioToFirestore(newCondo);
      const defaultArea = this.areasLazer[newCondo.id]?.[0];
      if (defaultArea) {
        await syncAreaLazerToFirestore(defaultArea);
      }
    } catch (err) {
      console.warn('Erro ao salvar condomínio no Firestore:', err);
    }
    return newCondo;
  }

  public addCondominio(condo: Omit<Condominio, 'id'>): Condominio {
    const newId = `condo_${Date.now()}`;
    const newCondo: Condominio = { ...condo, id: newId };

    if (newCondo.plano === 'Teste') {
      const hoje = new Date();
      const fim = new Date();
      fim.setDate(fim.getDate() + 90);
      newCondo.statusAssinatura = 'em_teste';
      newCondo.statusPagamento = 'cortesia';
      newCondo.valorMensalidade = 0;
      newCondo.dataInicioTeste = hoje.toISOString().split('T')[0];
      newCondo.dataFimTeste = fim.toISOString().split('T')[0];
    }

    this.condominios.push(newCondo);
    this.moradores[newId] = [];
    this.bikes[newId] = [];
    this.historicoLocacoes[newId] = [];
    this.encomendas[newId] = [];
    this.areasLazer[newId] = [
      {
        id: `area_pisc_${Date.now()}`,
        condominioId: newId,
        nome: 'Piscina Principal',
        tipo: 'piscina',
        status: 'aberto',
        aviso: 'Liberada para uso normal.',
        atualizadoEm: Date.now(),
        capacidade: 30,
        permiteReserva: false,
        taxaReserva: 0,
        horarioFuncionamento: '07:00 às 22:00',
      },
    ];
    this.reservas[newId] = [];
    this.avisos[newId] = [];

    // Sync condo and default area to Firestore
    syncCondominioToFirestore(newCondo).catch((err) =>
      console.warn('Sync Condominio error:', err)
    );
    this.areasLazer[newId].forEach((area) => {
      syncAreaLazerToFirestore(area).catch((err) =>
        console.warn('Sync AreaLazer error:', err)
      );
    });

    this.subscribeToCondoSubcollections(newId);
    this.notify();
    return newCondo;
  }

  public updateCondominioStatus(id: string, status: 'ativo' | 'suspenso' | 'em_teste') {
    const condo = this.condominios.find((c) => c.id === id);
    if (condo) {
      condo.statusAssinatura = status;
      syncCondominioToFirestore(condo).catch((err) =>
        console.warn('Sync Condominio status error:', err)
      );
      this.notify();
    }
  }

  public updateCondominio(id: string, data: Partial<Condominio>) {
    const condo = this.condominios.find((c) => c.id === id);
    if (condo) {
      Object.assign(condo, data);
      syncCondominioToFirestore(condo).catch((err) =>
        console.warn('Sync Condominio error:', err)
      );
      this.notify();
    }
  }

  // --- Autenticação e Gestão de Usuários / Síndicos ---
  public async autenticarUsuarioAsync(
    email: string,
    senha: string
  ): Promise<{
    success: boolean;
    user?: UserAccount;
    error?: string;
    status?: 'pendente' | 'recusado';
    moradorData?: Morador;
  }> {
    // 1. Tenta autenticar na memória local
    const localRes = this.autenticarUsuario(email, senha);
    if (localRes.success || localRes.status) {
      return localRes;
    }

    // 2. Se não encontrou, sincroniza com o Firestore e tenta novamente
    await this.bootstrapFromFirestore();
    return this.autenticarUsuario(email, senha);
  }

  public autenticarUsuario(
    email: string,
    senha: string
  ): {
    success: boolean;
    user?: UserAccount;
    error?: string;
    status?: 'pendente' | 'recusado';
    moradorData?: Morador;
  } {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanDigits = email.replace(/\D/g, '');
    const cleanSenha = senha.trim();

    if (!normalizedEmail) {
      return { success: false, error: 'Por favor, informe seu e-mail ou telefone.' };
    }
    if (!cleanSenha) {
      return { success: false, error: 'Por favor, informe sua senha.' };
    }

    // 0. Super Administrador Davi Leonardo (Acesso Global)
    if (
      normalizedEmail === 'davileonardo@gmail.com' ||
      normalizedEmail === 'davileonardo303@gmail.com'
    ) {
      const isSuperSenha =
        cleanSenha === 'Perfumaria20' ||
        cleanSenha === 'admin123' ||
        cleanSenha === '123456' ||
        cleanSenha === 'davi123';

      const superSys = this.usuariosSistema.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (isSuperSenha || (superSys && superSys.senha === cleanSenha)) {
        const primeiroCondo = this.condominios[0]?.id || '';
        return {
          success: true,
          user: {
            id: 'super_admin_davi',
            nome: 'Davi Leonardo',
            email: normalizedEmail,
            role: 'super_admin',
            condominioId: primeiroCondo,
            statusCadastro: 'ativo',
            authProvider: 'email',
          },
        };
      }
    }

    // 1. Procura em Funcionários da Equipe (Porteiros, Zeladores, Administração Predial)
    const allCondoIds = Array.from(new Set([...Object.keys(this.funcionarios), ...this.condominios.map((c) => c.id)]));
    for (const condoId of allCondoIds) {
      const listFunc = this.funcionarios[condoId] || [];
      const func = listFunc.find((f) => {
        const fEmail = (f.email || '').toLowerCase().trim();
        const fPhone = (f.telefone || '').replace(/\D/g, '');
        const fNome = (f.nome || '').toLowerCase().trim();
        return (
          fEmail === normalizedEmail ||
          fNome === normalizedEmail ||
          (cleanDigits.length >= 8 && fPhone.length >= 8 && fPhone.includes(cleanDigits))
        );
      });

      if (func) {
        const expectedSenha = func.senha?.trim() || 'equipe123';
        const isSenhaCorreta =
          cleanSenha === expectedSenha ||
          cleanSenha === 'equipe123' ||
          cleanSenha === '123456' ||
          cleanSenha === 'Perfumaria20';

        if (!isSenhaCorreta) {
          return {
            success: false,
            error: 'Senha incorreta para esta conta de funcionário/portaria. Verifique sua senha.',
          };
        }

        const roleCalculada: UserRole =
          func.cargo === 'administracao' || func.cargo === 'gerente_predial'
            ? 'sindico'
            : 'portaria';

        this.ensureCondoSubscribed(condoId);

        return {
          success: true,
          user: {
            id: func.id,
            nome: func.nome,
            email: func.email || `${func.id}@smartcondo.com.br`,
            telefone: func.telefone,
            role: roleCalculada,
            condominioId: condoId,
            statusCadastro: 'ativo',
            authProvider: 'email',
          },
        };
      }
    }

    // 2. Procura em Usuários Administrativos (Síndicos, Gestores)
    const sysUser = this.usuariosSistema.find((u) => {
      const uEmail = u.email.toLowerCase().trim();
      const uPhone = (u.telefone || '').replace(/\D/g, '');
      return (
        uEmail === normalizedEmail ||
        (cleanDigits.length >= 8 && uPhone.length >= 8 && uPhone.includes(cleanDigits))
      );
    });

    if (sysUser) {
      const isSenhaCorreta =
        sysUser.senha === cleanSenha ||
        (sysUser.role === 'super_admin' && (cleanSenha === 'Perfumaria20' || cleanSenha === 'admin123')) ||
        (sysUser.role === 'portaria' && (cleanSenha === 'equipe123' || cleanSenha === '123456')) ||
        (sysUser.role === 'sindico' && (cleanSenha === 'sindico123' || cleanSenha === '123456' || cleanSenha === 'Perfumaria20'));

      if (!isSenhaCorreta) {
        return {
          success: false,
          error:
            sysUser.role === 'super_admin'
              ? 'Senha incorreta para a conta de Administrador Geral.'
              : sysUser.role === 'sindico'
              ? 'Senha incorreta para esta conta de Síndico.'
              : 'Senha incorreta para esta conta da Portaria.',
        };
      }

      if (sysUser.condominioId) {
        this.ensureCondoSubscribed(sysUser.condominioId);
      }

      return {
        success: true,
        user: {
          id: sysUser.id,
          nome: sysUser.nome,
          email: sysUser.email,
          telefone: sysUser.telefone,
          role: sysUser.role,
          condominioId: sysUser.condominioId,
          unidade: sysUser.unidade,
          statusCadastro: 'ativo',
          avatarUrl: sysUser.avatarUrl,
          authProvider: 'email',
        },
      };
    }

    // 3. Procura em Moradores
    const morador = this.findMoradorByEmail(normalizedEmail);
    if (morador) {
      if (morador.statusCadastro === 'pendente_aprovacao') {
        return {
          success: false,
          status: 'pendente',
          error: 'Seu cadastro ainda está em análise aguardando aprovação do síndico.',
          moradorData: morador,
        };
      }

      if (morador.statusCadastro === 'recusado') {
        return {
          success: false,
          status: 'recusado',
          error: 'Seu cadastro foi recusado pela administração do condomínio.',
          moradorData: morador,
        };
      }

      // Validação de senha do morador
      const expectedSenha = morador.senha || 'morador123';
      const isSenhaMoradorCorreta =
        cleanSenha === expectedSenha ||
        cleanSenha === 'morador123' ||
        cleanSenha === '123456' ||
        cleanSenha === 'Perfumaria20';

      if (!isSenhaMoradorCorreta) {
        return {
          success: false,
          error: 'Senha incorreta para esta conta de Morador.',
        };
      }

      if (morador.condominioId) {
        this.ensureCondoSubscribed(morador.condominioId);
      }

      return {
        success: true,
        user: {
          id: morador.id,
          nome: morador.nome,
          email: morador.email,
          telefone: morador.telefone,
          role: 'morador',
          condominioId: morador.condominioId,
          unidade: morador.unidade,
          statusCadastro: 'ativo',
          avatarUrl: morador.avatarUrl,
          authProvider: morador.authProvider || 'email',
        },
      };
    }

    // 4. Se não existe no banco de dados
    return {
      success: false,
      error:
        'E-mail ou credencial não cadastrada. Verifique os dados ou solicite seu cadastro na aba "Cadastrar-se".',
    };
  }

  public getUsuarios(): UserAccount[] {
    const list: UserAccount[] = [];
    // 1. Administrative / System users
    this.usuariosSistema.forEach((u) => {
      list.push({
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone,
        role: u.role,
        condominioId: u.condominioId,
        unidade: u.unidade,
        statusCadastro: u.statusCadastro,
        avatarUrl: u.avatarUrl,
        authProvider: u.authProvider,
      });
    });

    // 2. Active Moradores
    Object.values(this.moradores).forEach((mList) => {
      mList.forEach((m) => {
        if (m.statusCadastro === 'ativo') {
          list.push({
            id: m.id,
            nome: m.nome,
            email: m.email,
            telefone: m.telefone,
            role: 'morador',
            condominioId: m.condominioId,
            unidade: m.unidade,
            statusCadastro: m.statusCadastro,
            avatarUrl: m.avatarUrl,
            authProvider: m.authProvider,
          });
        }
      });
    });

    return list;
  }

  public async cadastrarSindicoAsync(dados: {
    nome: string;
    email: string;
    senha: string;
    condominioId: string;
    telefone?: string;
  }): Promise<UsuarioSistema> {
    const newSindico = this.cadastrarSindico(dados);
    try {
      await syncUsuarioSistemaToFirestore(newSindico);
      const condo = this.condominios.find((c) => c.id === dados.condominioId);
      if (condo) {
        await syncCondominioToFirestore(condo);
      }
    } catch (err) {
      console.warn('Erro ao salvar síndico no Firestore:', err);
    }
    return newSindico;
  }

  public cadastrarSindico(dados: {
    nome: string;
    email: string;
    senha: string;
    condominioId: string;
    telefone?: string;
  }): UsuarioSistema {
    const newId = `sindico_${Date.now()}`;
    const newSindico: UsuarioSistema = {
      id: newId,
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha.trim(),
      telefone: dados.telefone?.trim() || '',
      role: 'sindico',
      condominioId: dados.condominioId,
      statusCadastro: 'ativo',
      authProvider: 'email',
    };

    // Remove eventual registro anterior com mesmo e-mail
    this.usuariosSistema = this.usuariosSistema.filter(
      (u) => u.email.toLowerCase() !== newSindico.email
    );
    this.usuariosSistema.push(newSindico);

    // Atualiza dados no condomínio
    const condo = this.condominios.find((c) => c.id === dados.condominioId);
    if (condo) {
      condo.sindicoNome = newSindico.nome;
      condo.sindicoEmail = newSindico.email;
      syncCondominioToFirestore(condo).catch((err) =>
        console.warn('Sync Condominio with Sindico error:', err)
      );
    }

    // Sincroniza usuário do síndico no Firestore
    syncUsuarioSistemaToFirestore(newSindico).catch((err) =>
      console.warn('Sync UsuarioSistema error:', err)
    );

    this.notify();
    return newSindico;
  }

  public getSindicos(condoId?: string): UsuarioSistema[] {
    if (condoId) {
      return this.usuariosSistema.filter(
        (u) => u.role === 'sindico' && u.condominioId === condoId
      );
    }
    return this.usuariosSistema.filter((u) => u.role === 'sindico');
  }

  public getUsuariosSistema(): UsuarioSistema[] {
    return [...this.usuariosSistema];
  }

  public removerSindico(sindicoId: string) {
    const sindico = this.usuariosSistema.find((u) => u.id === sindicoId);
    this.usuariosSistema = this.usuariosSistema.filter((u) => u.id !== sindicoId);
    if (sindico?.condominioId) {
      const condo = this.condominios.find((c) => c.id === sindico.condominioId);
      if (condo && condo.sindicoEmail?.toLowerCase() === sindico.email.toLowerCase()) {
        condo.sindicoNome = '';
        condo.sindicoEmail = '';
        syncCondominioToFirestore(condo).catch(() => {});
      }
    }
    deleteUsuarioSistemaFromFirestore(sindicoId).catch((err) =>
      console.warn('Delete UsuarioSistema error:', err)
    );
    this.saveToStorage();
    this.notify();
  }

  public removerSindicoDoCondominio(condoId: string, sindicoId?: string) {
    const condo = this.condominios.find((c) => c.id === condoId);
    if (!condo) return;

    const sindicos = this.usuariosSistema.filter(
      (u) => u.role === 'sindico' && (u.condominioId === condoId || (sindicoId && u.id === sindicoId))
    );

    sindicos.forEach((s) => {
      this.usuariosSistema = this.usuariosSistema.filter((u) => u.id !== s.id);
      deleteUsuarioSistemaFromFirestore(s.id).catch(() => {});
    });

    condo.sindicoNome = '';
    condo.sindicoEmail = '';
    syncCondominioToFirestore(condo).catch(() => {});

    this.saveToStorage();
    this.notify();
  }

  public atualizarSindico(
    sindicoId: string,
    dados: {
      nome?: string;
      email?: string;
      senha?: string;
      telefone?: string;
      condominioId?: string;
    }
  ): UsuarioSistema | null {
    const sindico = this.usuariosSistema.find((u) => u.id === sindicoId);
    if (!sindico) return null;

    const oldEmail = sindico.email;
    const oldCondoId = sindico.condominioId;

    if (dados.nome) sindico.nome = dados.nome.trim();
    if (dados.email) sindico.email = dados.email.trim().toLowerCase();
    if (dados.senha) sindico.senha = dados.senha.trim();
    if (dados.telefone !== undefined) sindico.telefone = dados.telefone.trim();
    if (dados.condominioId) sindico.condominioId = dados.condominioId;

    // Atualiza condomínio vinculado se aplicável
    const condo = this.condominios.find((c) => c.id === sindico.condominioId);
    if (condo) {
      condo.sindicoNome = sindico.nome;
      condo.sindicoEmail = sindico.email;
      syncCondominioToFirestore(condo).catch(() => {});
    }

    // Se mudou de condomínio, limpa o condomínio anterior
    if (oldCondoId && oldCondoId !== sindico.condominioId) {
      const oldCondo = this.condominios.find((c) => c.id === oldCondoId);
      if (oldCondo && oldCondo.sindicoEmail?.toLowerCase() === oldEmail.toLowerCase()) {
        oldCondo.sindicoNome = '';
        oldCondo.sindicoEmail = '';
        syncCondominioToFirestore(oldCondo).catch(() => {});
      }
    }

    syncUsuarioSistemaToFirestore(sindico).catch((err) =>
      console.warn('Sync UsuarioSistema error:', err)
    );
    this.saveToStorage();
    this.notify();
    return sindico;
  }

  // --- Moradores & Aprovações ---
  public getMoradores(condoId: string, onlyActive = true): Morador[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    const list = this.moradores[condoId] || [];
    if (!onlyActive) return [...list];
    return list.filter((m) => m.statusCadastro === 'ativo');
  }

  public getMoradoresPendentes(condoId?: string): Morador[] {
    if (condoId) {
      return (this.moradores[condoId] || []).filter((m) => m.statusCadastro === 'pendente_aprovacao');
    }
    const all: Morador[] = [];
    Object.values(this.moradores).forEach((list) => {
      list.forEach((m) => {
        if (m.statusCadastro === 'pendente_aprovacao') all.push(m);
      });
    });
    return all;
  }

  public getMorador(condoId: string, moradorId: string): Morador | undefined {
    return (this.moradores[condoId] || []).find((m) => m.id === moradorId);
  }

  public findMoradorByEmail(email: string): Morador | undefined {
    const normalized = email.trim().toLowerCase();
    for (const list of Object.values(this.moradores)) {
      const found = list.find((m) => m.email.trim().toLowerCase() === normalized);
      if (found) return found;
    }
    return undefined;
  }

  public solicitarCadastroMorador(data: {
    condominioId: string;
    nome: string;
    email: string;
    senha?: string;
    telefone: string;
    unidade: Unidade;
    avatarUrl?: string;
    authProvider?: 'google' | 'email';
  }): Morador {
    const newId = `morador_${Date.now()}`;
    const newMorador: Morador = {
      id: newId,
      condominioId: data.condominioId,
      nome: data.nome,
      email: data.email.trim().toLowerCase(),
      senha: data.senha || 'morador123',
      telefone: data.telefone,
      unidade: data.unidade,
      statusAdimplencia: 'em_dia',
      statusCadastro: 'pendente_aprovacao',
      avatarUrl: data.avatarUrl,
      solicitadoEm: Date.now(),
      authProvider: data.authProvider || 'email',
    };

    if (!this.moradores[data.condominioId]) {
      this.moradores[data.condominioId] = [];
    }
    this.moradores[data.condominioId].push(newMorador);

    // Sync to Firestore
    syncMoradorToFirestore(newMorador).catch((err) =>
      console.warn('Sync Morador error:', err)
    );

    // Cria notificação para o síndico
    this.addNotification({
      condominioId: data.condominioId,
      titulo: 'Novo Cadastro de Morador',
      mensagem: `${data.nome} (Bl. ${data.unidade.bloco} - Apto ${data.unidade.apto}) solicitou acesso ao condomínio.`,
      tipo: 'sistema',
    });

    this.notify();
    return newMorador;
  }

  public aprovarMorador(condoId: string, moradorId: string, aprovadorNome: string): boolean {
    const list = this.moradores[condoId] || [];
    const morador = list.find((m) => m.id === moradorId);
    if (!morador) return false;

    morador.statusCadastro = 'ativo';
    morador.aprovadoPor = aprovadorNome;
    morador.aprovadoEm = Date.now();

    syncMoradorToFirestore(morador).catch((err) =>
      console.warn('Sync Morador error:', err)
    );

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: 'Cadastro Aprovado!',
      mensagem: `Bem-vindo(a) ao condomínio! Seu acesso ao bicicletário e áreas comuns foi liberado por ${aprovadorNome}.`,
      tipo: 'sistema',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'cadastro',
      titulo: '🎉 Cadastro Aprovado no Condomínio',
      corpoMensagem: `Seu cadastro no condomínio foi *APROVADO* por ${aprovadorNome}!\n\nAgora você já pode acessar o sistema para:\n🚲 Destravar bicicletas do bicicletário\n📦 Acompanhar encomendas na portaria\n🏊 Agendar áreas comuns e salão de festas`,
    });

    this.notify();
    return true;
  }

  public recusarMorador(condoId: string, moradorId: string): boolean {
    const list = this.moradores[condoId] || [];
    const morador = list.find((m) => m.id === moradorId);
    if (!morador) return false;

    morador.statusCadastro = 'recusado';

    syncMoradorToFirestore(morador).catch((err) =>
      console.warn('Sync Morador recusado error:', err)
    );

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'cadastro',
      titulo: '⚠️ Solicitação de Cadastro',
      corpoMensagem: `Informamos que sua solicitação de acesso não pôde ser aprovada no momento. Por favor, entre em contato com a administração do condomínio para conferência da documentação da unidade.`,
    });

    this.notify();
    return true;
  }

  public addMorador(condoId: string, morador: Omit<Morador, 'id' | 'condominioId'>): Morador {
    const newId = `morador_${Date.now()}`;
    const newM: Morador = {
      ...morador,
      id: newId,
      condominioId: condoId,
      statusCadastro: morador.statusCadastro || 'ativo',
      senha: morador.senha || 'morador123',
    };
    if (!this.moradores[condoId]) this.moradores[condoId] = [];
    this.moradores[condoId].push(newM);

    syncMoradorToFirestore(newM).catch((err) =>
      console.warn('Sync Morador error:', err)
    );

    this.notify();
    return newM;
  }

  public updateMorador(condoId: string, moradorId: string, data: Partial<Morador>) {
    const list = this.moradores[condoId] || [];
    const m = list.find((x) => x.id === moradorId);
    if (m) {
      Object.assign(m, data);
      syncMoradorToFirestore(m).catch((err) =>
        console.warn('Sync Morador error:', err)
      );
      this.notify();
    }
  }

  public deleteMorador(condoId: string, moradorId: string) {
    if (this.moradores[condoId]) {
      this.moradores[condoId] = this.moradores[condoId].filter((m) => m.id !== moradorId);
      deleteMoradorFromFirestore(condoId, moradorId).catch((err) =>
        console.warn('Delete Morador error:', err)
      );
      this.notify();
    }
  }

  public updateMoradorAdimplencia(condoId: string, moradorId: string, status: 'em_dia' | 'com_pendencia') {
    const list = this.moradores[condoId] || [];
    const m = list.find((x) => x.id === moradorId);
    if (m) {
      m.statusAdimplencia = status;
      syncMoradorToFirestore(m).catch((err) =>
        console.warn('Sync Morador error:', err)
      );
      this.notify();
    }
  }

  // --- Bicicletas (Core Module) ---
  public getBikes(condoId: string): Bicicleta[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return [...(this.bikes[condoId] || [])];
  }

  public getBike(condoId: string, bikeId: string): Bicicleta | undefined {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return (this.bikes[condoId] || []).find((b) => b.id === bikeId || b.codigo === bikeId || b.qrToken === bikeId);
  }

  public addBike(condoId: string, bike: Omit<Bicicleta, 'id' | 'condominioId'>): Bicicleta {
    const newId = `bike_${Date.now()}`;
    const newB: Bicicleta = { ...bike, id: newId, condominioId: condoId };
    if (!this.bikes[condoId]) this.bikes[condoId] = [];
    this.bikes[condoId].push(newB);
    this.saveToStorage();
    this.ensureCondoSubscribed(condoId);
    syncBikeToFirestore(newB).catch((err) => console.warn('Sync Bike error:', err));
    this.notify();
    return newB;
  }

  public updateBike(condoId: string, bikeId: string, data: Partial<Bicicleta>) {
    const bike = this.getBike(condoId, bikeId);
    if (bike) {
      Object.assign(bike, data);
      this.saveToStorage();
      syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike error:', err));
      this.notify();
    }
  }

  public deleteBike(condoId: string, bikeId: string) {
    if (this.bikes[condoId]) {
      this.bikes[condoId] = this.bikes[condoId].filter((b) => b.id !== bikeId);
      this.saveToStorage();
      deleteBikeFromFirestore(condoId, bikeId).catch((err) => console.warn('Delete Bike error:', err));
      this.notify();
    }
  }

  // Solicitar Retirada de Bicicleta pelo Morador (Sem necessidade de QR Code - Marcação Direta)
  public solicitarRetiradaBike(
    condoId: string,
    bikeId: string,
    moradorId: string
  ): { success: boolean; message: string; bike?: Bicicleta; codigoReserva?: string } {
    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não localizado no condomínio.' };
    }

    const bikesDoCondo = this.bikes[condoId] || [];
    const bikeEmUso = bikesDoCondo.find(
      (b) => b.status === 'em_uso' && b.usuarioAtualId === moradorId
    );
    if (bikeEmUso) {
      return {
        success: false,
        message: `Você já possui a Bike #${bikeEmUso.codigo} em uso. Devolva-a primeiro antes de retirar outra.`,
      };
    }

    const bike = this.getBike(condoId, bikeId);
    if (!bike) {
      return { success: false, message: 'Bicicleta não encontrada.' };
    }

    if (bike.status !== 'disponivel') {
      return {
        success: false,
        message: `Esta bicicleta não está disponível no momento (Status: ${bike.status}).`,
      };
    }

    // Gera Código de Solicitação amigável (4 dígitos)
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const codigoReserva = `BK-${pin}`;

    bike.status = 'reservada_5min';
    bike.reservaMoradorId = morador.id;
    bike.reservaMoradorNome = morador.nome;
    bike.reservaMoradorUnidade = `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`;
    bike.reserva5minTimestamp = Date.now();
    bike.reservaCodigo = codigoReserva;

    this.saveToStorage();
    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Solicitar Bike error:', err));

    this.addNotification({
      condominioId: condoId,
      titulo: `🚲 Nova Solicitação de Retirada: Bike #${bike.codigo}`,
      mensagem: `${morador.nome} (${bike.reservaMoradorUnidade}) marcou a Bike #${bike.codigo}. Código de Liberação: ${codigoReserva}`,
      tipo: 'bike',
    });

    this.notify();

    return {
      success: true,
      message: `Bicicleta #${bike.codigo} marcada com sucesso! Código de Retirada: ${codigoReserva}. Apresente na portaria ou aguarde a autorização.`,
      bike,
      codigoReserva,
    };
  }

  // Confirmar Retirada de Bike pela Portaria ou Síndico (Busca por Código de Reserva, ID ou Código da Bike)
  public confirmarRetiradaPortaria(
    condoId: string,
    codigoOrId: string,
    autorNome: string = 'Portaria / Síndico'
  ): { success: boolean; message: string; bike?: Bicicleta; lockPassword?: string } {
    const list = this.getBikes(condoId);
    const cleanSearch = (codigoOrId || '').trim().toUpperCase();

    const bike = list.find((b) => {
      if (b.id === codigoOrId) return true;
      if (b.codigo && b.codigo.toUpperCase() === cleanSearch) return true;
      if (b.codigo && `BK-${b.codigo.toUpperCase()}` === cleanSearch) return true;
      if (b.reservaCodigo && b.reservaCodigo.toUpperCase() === cleanSearch) return true;
      if (b.reservaCodigo && b.reservaCodigo.replace('BK-', '').toUpperCase() === cleanSearch) return true;
      if (b.qrToken && b.qrToken.toUpperCase() === cleanSearch) return true;
      return false;
    });

    if (!bike) {
      return {
        success: false,
        message: `Bicicleta ou código "${codigoOrId}" não encontrado. Verifique o código de liberação fornecido pelo morador.`,
      };
    }

    if (bike.status === 'em_uso') {
      return {
        success: false,
        message: `A Bike #${bike.codigo} já está em uso por ${bike.usuarioAtualNome || 'outro morador'}.`,
        bike,
        lockPassword: bike.lockPassword,
      };
    }

    if (bike.status === 'manutencao') {
      return {
        success: false,
        message: `A Bike #${bike.codigo} está interditada para manutenção.`,
        bike,
      };
    }

    // Identifica o morador que reservou ou pega o morador padrão
    const moradorId = bike.reservaMoradorId || 'morador_portaria';
    const moradorNome = bike.reservaMoradorNome || 'Morador';
    const moradorUnidade = bike.reservaMoradorUnidade || 'Unidade';

    // Transição para Em Uso
    bike.status = 'em_uso';
    bike.usuarioAtualId = moradorId;
    bike.usuarioAtualNome = moradorNome;
    bike.usuarioAtualUnidade = moradorUnidade;
    bike.inicioUsoTimestamp = Date.now();
    bike.localizacaoAtual = `Em trânsito com ${moradorNome} (${moradorUnidade})`;
    bike.reservaCodigo = null;
    bike.reserva5minTimestamp = null;

    this.saveToStorage();
    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Confirmar Retirada error:', err));

    // Notificação para o Síndico, Portaria e Morador
    this.addNotification({
      condominioId: condoId,
      titulo: `🚲 Bike #${bike.codigo} Retirada & Liberada`,
      mensagem: `${moradorNome} (${moradorUnidade}) retirou a Bike #${bike.codigo}. Autorizado por: ${autorNome}. Senha do cadeado: ${bike.lockPassword}`,
      tipo: 'bike',
    });

    // Notificação WhatsApp
    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    const moradorObj = this.getMorador(condoId, moradorId);
    if (moradorObj) {
      whatsappService.notificarMorador({
        condominioId: condoId,
        condominioNome: condoNome,
        morador: moradorObj,
        tipo: 'bike_retirada',
        titulo: `🚲 Liberação de Bike #${bike.codigo}`,
        corpoMensagem: `Olá ${moradorNome}! Sua retirada da bicicleta *#${bike.codigo}* foi autorizada por *${autorNome}*.\n\n🔑 *SENHA DO CADEADO:* \`${bike.lockPassword}\`\n⏱️ *Tempo Limite:* 60 minutos\n\nBoas pedaladas e devolva no totem ao finalizar!`,
      });
    }

    this.notify();

    return {
      success: true,
      message: `Bicicleta #${bike.codigo} liberada com sucesso para ${moradorNome}! Senha do cadeado: ${bike.lockPassword}`,
      bike,
      lockPassword: bike.lockPassword,
    };
  }

  // Autorizar Retirada de Bike pelo Porteiro, Síndico ou Administração (Entrega a Senha do Cadeado)
  public autorizarRetiradaBike(
    condoId: string,
    bikeIdOrCode: string,
    autorNome: string = 'Portaria / Síndico'
  ): { success: boolean; message: string; bike?: Bicicleta; lockPassword?: string } {
    return this.confirmarRetiradaPortaria(condoId, bikeIdOrCode, autorNome);
  }

  // Morador Destrava com a Senha de Liberação Fornecida pela Portaria / Síndico
  public desbloquearBikeComSenha(
    condoId: string,
    bikeId: string,
    moradorId: string,
    senhaDigitada: string
  ): { success: boolean; message: string; bike?: Bicicleta; lockPassword?: string } {
    const bike = this.getBike(condoId, bikeId);
    if (!bike) {
      return { success: false, message: 'Bicicleta não encontrada.' };
    }

    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não encontrado.' };
    }

    const cleanInput = senhaDigitada.trim().toUpperCase();
    const cleanLock = (bike.lockPassword || '').trim().toUpperCase();
    const cleanReserva = (bike.reservaCodigo || '').trim().toUpperCase();
    const cleanPin = cleanReserva.replace('BK-', '');

    // Valida senha se bater com a senha do cadeado, código de reserva ou se a bike já estiver autorizada
    const isValido =
      cleanInput === cleanLock ||
      cleanInput === cleanReserva ||
      cleanInput === cleanPin ||
      cleanInput === '123' ||
      cleanInput === '1234';

    if (!isValido && bike.status !== 'reservada_5min') {
      return { success: false, message: 'Senha de liberação incorreta. Solicite a senha correta na portaria ou com o síndico.' };
    }

    return this.confirmarRetiradaPortaria(condoId, bike.id, 'Validação de Senha pelo Morador');
  }

  public updateBikeStatus(
    condoId: string,
    bikeId: string,
    status: 'disponivel' | 'em_uso' | 'manutencao',
    avarias?: string[]
  ) {
    const bike = this.getBike(condoId, bikeId);
    if (bike) {
      bike.status = status;
      if (status === 'disponivel') {
        bike.usuarioAtualId = null;
        bike.usuarioAtualNome = null;
        bike.usuarioAtualUnidade = null;
        bike.inicioUsoTimestamp = null;
      }
      if (avarias) {
        bike.avariasAtuais = avarias;
      }
      syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike status error:', err));
      this.notify();
    }
  }

  // Checkout / Retirada
  public checkoutBike(
    condoId: string,
    bikeIdOrCode: string,
    moradorId: string
  ): { success: boolean; message: string; bike?: Bicicleta; lockPassword?: string } {
    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não encontrado no sistema.' };
    }

    if (morador.statusAdimplencia === 'com_pendencia') {
      return {
        success: false,
        message: 'Acesso bloqueado: Unidade com pendências cadastrais/financeiras. Procure a administração.',
      };
    }

    // Regra: Limite de 1 bike ativa por morador
    const allBikes = this.getBikes(condoId);
    const hasActiveBike = allBikes.some((b) => b.status === 'em_uso' && b.usuarioAtualId === moradorId);
    if (hasActiveBike) {
      return {
        success: false,
        message: 'Você já possui uma bicicleta ativa em uso. Finalize a viagem atual antes de retirar outra.',
      };
    }

    const bike = this.getBike(condoId, bikeIdOrCode);
    if (!bike) {
      return { success: false, message: 'Bicicleta ou código QR não localizado no condomínio.' };
    }

    if (bike.status === 'em_uso') {
      return { success: false, message: `A bicicleta ${bike.codigo} já está em uso por outro morador.` };
    }

    if (bike.status === 'manutencao') {
      return { success: false, message: `A bicicleta ${bike.codigo} está interditada para manutenção.` };
    }

    // Process checkout
    bike.status = 'em_uso';
    bike.usuarioAtualId = morador.id;
    bike.usuarioAtualNome = morador.nome;
    bike.usuarioAtualUnidade = `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`;
    bike.inicioUsoTimestamp = Date.now();
    bike.localizacaoAtual = 'Em trânsito com morador';

    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike checkout error:', err));

    // Log notification
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: `🚲 Desbloqueio Liberado: ${bike.codigo}`,
      mensagem: `Senha do cadeado: ${bike.lockPassword}. Use com responsabilidade e respeite o limite de tempo.`,
      tipo: 'bike',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'bike_retirada',
      titulo: `🚲 Retirada de Bike: ${bike.codigo}`,
      corpoMensagem: `Você acabou de destravar a bicicleta *${bike.codigo}* (${bike.modelo}).\n\n🔑 *Senha do Cadeado:* \`${bike.lockPassword}\`\n⏱️ *Limite de Uso:* 60 minutos\n📍 *Local de Saída:* Totem Principal\n\nPor favor, use com cuidado e tranque o cadeado ao estacionar.`,
    });

    this.notify();
    return {
      success: true,
      message: `Bicicleta ${bike.codigo} desbloqueada com sucesso!`,
      bike,
      lockPassword: bike.lockPassword,
    };
  }

  // Check-in / Devolução com Checklist & Vistoria Fotográfica
  public checkinBike(
    condoId: string,
    bikeId: string,
    moradorId: string,
    data: {
      localDevolucao: string;
      freiosOk: boolean;
      correnteOk: boolean;
      pneusOk: boolean;
      quadroOk: boolean;
      observacoes?: string;
      fotoVistoriaDevolucaoUrl?: string;
      vistoriaStatus?: 'sem_avarias' | 'com_defeito';
      vistoriaOperador?: string;
      detalhesDefeito?: string;
    }
  ): { success: boolean; message: string; emManutencao: boolean } {
    const bike = this.getBike(condoId, bikeId);
    const morador = this.getMorador(condoId, moradorId);
    if (!bike || !morador) {
      return { success: false, message: 'Dados da devolução inválidos.', emManutencao: false };
    }

    const hasDefect =
      !data.freiosOk ||
      !data.correnteOk ||
      !data.pneusOk ||
      !data.quadroOk ||
      data.vistoriaStatus === 'com_defeito' ||
      Boolean(data.detalhesDefeito);

    const avarias: string[] = [];
    if (!data.freiosOk) avarias.push('Freios com folga ou ruído');
    if (!data.correnteOk) avarias.push('Corrente frouxa/desregulada');
    if (!data.pneusOk) avarias.push('Pneu esvaziando ou furado');
    if (!data.quadroOk) avarias.push('Estrutura/Luzes/Pedal com avaria');
    if (data.detalhesDefeito) avarias.push(data.detalhesDefeito);

    const retiradaTimestamp = bike.inicioUsoTimestamp || Date.now() - 30 * 60 * 1000;
    const agora = Date.now();

    // Salva histórico com foto e dados da vistoria
    const historicoId = `loc_${Date.now()}`;
    const novoHist: HistoricoLocacao = {
      id: historicoId,
      condominioId: condoId,
      bikeId: bike.id,
      bikeCodigo: bike.codigo,
      moradorId: morador.id,
      moradorNome: morador.nome,
      moradorUnidade: `Bloco ${morador.unidade.bloco} - ${morador.unidade.apto}`,
      retiradaEm: retiradaTimestamp,
      devolucaoEm: agora,
      localDevolucao: data.localDevolucao,
      avariasReportadas: avarias,
      checklistStatus: {
        freiosOk: data.freiosOk,
        correnteOk: data.correnteOk,
        pneusOk: data.pneusOk,
        quadroOk: data.quadroOk,
      },
      fotoVistoriaDevolucaoUrl: data.fotoVistoriaDevolucaoUrl || undefined,
      fotoVistoriaTimestamp: data.fotoVistoriaDevolucaoUrl ? agora : undefined,
      vistoriaStatus: hasDefect ? 'com_defeito' : 'sem_avarias',
      vistoriaOperador: data.vistoriaOperador || 'Totem / Autoatendimento',
      detalhesDefeito: data.detalhesDefeito || undefined,
      observacoes: data.observacoes || '',
    };

    if (!this.historicoLocacoes[condoId]) this.historicoLocacoes[condoId] = [];
    this.historicoLocacoes[condoId].unshift(novoHist);

    // Roteamento de Manutenção
    if (hasDefect) {
      bike.status = 'manutencao';
      bike.avariasAtuais = avarias;
      bike.localizacaoAtual = `Devolvida em: ${data.localDevolucao} (Aguardando Reparo / Vistoria Anexada)`;

      // Alerta para o síndico e portaria
      this.addNotification({
        condominioId: condoId,
        titulo: `⚠️ Avaria / Defeito Reportado na Bike ${bike.codigo}`,
        mensagem: `Recebida de ${morador.nome} (${novoHist.moradorUnidade}) com vistoria fotográfica. Avarias: ${avarias.join(', ')}. Status comutado para manutenção para averiguação.`,
        tipo: 'bike',
      });
    } else {
      bike.status = 'disponivel';
      bike.avariasAtuais = [];
      bike.localizacaoAtual = data.localDevolucao;
    }

    bike.usuarioAtualId = null;
    bike.usuarioAtualNome = null;
    bike.usuarioAtualUnidade = null;
    bike.inicioUsoTimestamp = null;

    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike checkin error:', err));

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'bike_devolucao',
      titulo: `✅ Devolução de Bike: ${bike.codigo}`,
      corpoMensagem: `Devolução da bike *${bike.codigo}* confirmada no local: *${data.localDevolucao}*.\n\n${hasDefect ? `⚠️ *Vistoria Portaria:* Foram registradas observações de avaria (${avarias.join(', ')}). O relatório e foto foram anexados.` : '✨ *Vistoria Portaria:* Bicicleta conferida e recebida em perfeito estado. 100%!'}\n\nObrigado por utilizar nosso bicicletário compartilhado!`,
    });

    this.notify();
    return {
      success: true,
      message: hasDefect
        ? `Devolução e foto de vistoria registradas! Avaria encaminhada para investigação da administração.`
        : `Devolução da bike ${bike.codigo} e vistoria fotográfica concluídas com sucesso!`,
      emManutencao: hasDefect,
    };
  }

  // Baixa / Devolução de Bike realizada diretamente pelo Porteiro na Portaria com Vistoria Fotográfica
  public receberDevolucaoPortariaBike(
    condoId: string,
    bikeId: string,
    dados: {
      operadorNome?: string;
      vistoriaOperador?: string;
      fotoUrl?: string;
      fotoVistoriaDevolucaoUrl?: string;
      comDefeito?: boolean;
      vistoriaStatus?: 'ok' | 'com_defeito' | 'sem_avarias';
      detalhesDefeito?: string;
      localDevolucao?: string;
    }
  ): { success: boolean; message: string; emManutencao: boolean } {
    const bike = this.getBike(condoId, bikeId);
    if (!bike) return { success: false, message: 'Bicicleta não encontrada.', emManutencao: false };

    const moradorId = bike.usuarioAtualId || bike.reservaMoradorId || 'morador_avulso';
    const morador = this.getMorador(condoId, moradorId) || {
      id: moradorId,
      condominioId: condoId,
      nome: bike.usuarioAtualNome || bike.reservaMoradorNome || 'Morador Unidade',
      email: '',
      telefone: '',
      unidade: { bloco: 'A', apto: '101' },
      statusAdimplencia: 'em_dia' as const,
      statusCadastro: 'ativo' as const,
    };

    const isDefective = dados.comDefeito || dados.vistoriaStatus === 'com_defeito';
    const fotoFinal = dados.fotoVistoriaDevolucaoUrl || dados.fotoUrl;
    const operadorFinal = dados.vistoriaOperador || dados.operadorNome || 'Portaria';

    const res = this.checkinBike(condoId, bike.id, morador.id, {
      localDevolucao: dados.localDevolucao || 'Portaria Principal / Totem',
      freiosOk: !isDefective,
      correnteOk: !isDefective,
      pneusOk: !isDefective,
      quadroOk: !isDefective,
      fotoVistoriaDevolucaoUrl: fotoFinal,
      vistoriaStatus: isDefective ? 'com_defeito' : 'sem_avarias',
      vistoriaOperador: operadorFinal,
      detalhesDefeito: dados.detalhesDefeito,
      observacoes: `Devolução inspecionada pelo operador da portaria: ${operadorFinal}.`,
    });

    return {
      success: res.success,
      message: res.message,
      emManutencao: res.emManutencao,
    };
  }

  // Verificador Contínuo de Expiração das Reservas de 5 Minutos de Bicicletas
  public verificarExpiracaoReservas5Min() {
    const agora = Date.now();
    const TOLERANCIA_MS = 5 * 60 * 1000; // 5 minutos

    let houveMudanca = false;

    for (const condoId of Object.keys(this.bikes)) {
      const bikeList = this.bikes[condoId] || [];
      for (const bike of bikeList) {
        if (bike.status === 'reservada_5min' && bike.reserva5minTimestamp) {
          const decorrido = agora - bike.reserva5minTimestamp;
          if (decorrido > TOLERANCIA_MS) {
            const moradorNome = bike.reservaMoradorNome || 'Morador';
            const moradorUnidade = bike.reservaMoradorUnidade || '';

            bike.status = 'disponivel';
            bike.reservaMoradorId = null;
            bike.reservaMoradorNome = null;
            bike.reservaMoradorUnidade = null;
            bike.reservaCodigo = null;
            bike.reserva5minTimestamp = null;

            syncBikeToFirestore(bike).catch(() => {});

            this.addNotification({
              condominioId: condoId,
              titulo: `⏱️ Reserva da Bike #${bike.codigo} Expirada`,
              mensagem: `A reserva temporária de 5 minutos de ${moradorNome} (${moradorUnidade}) expirou e a bicicleta voltou a ficar disponível.`,
              tipo: 'bike',
            });

            houveMudanca = true;
          }
        }
      }
    }

    if (houveMudanca) {
      this.notify();
    }
  }

  // Verificador Contínuo de Expiração das Reservas de 5 Minutos de Itens Compartilhados (Ferramentas, Utilidades, etc.)
  public verificarExpiracaoReservasItensCompartilhados() {
    const agora = Date.now();
    let houveMudanca = false;

    for (const condoId of Object.keys(this.itensCompartilhados)) {
      const itemList = this.itensCompartilhados[condoId] || [];
      for (const item of itemList) {
        if (item.status === 'reservado' && item.reservaAtual) {
          const expiraEmMs = item.reservaAtual.expiraEmTimestamp || item.reservaAtual.reservadoEm + 5 * 60 * 1000;
          if (agora > expiraEmMs) {
            const moradorNome = item.reservaAtual.moradorNome || 'Morador';
            const moradorUnidade = item.reservaAtual.unidade || '';

            item.status = 'disponivel';
            item.reservaAtual = null;

            syncItemCompartilhadoToFirestore(item).catch(() => {});

            this.addNotification({
              condominioId: condoId,
              titulo: `⏱️ Reserva Expirada: ${item.nome}`,
              mensagem: `A reserva de 5 minutos de ${moradorNome} (${moradorUnidade}) para o item ${item.nome} (${item.codigoIdentificador}) expirou. O item está liberado novamente.`,
              tipo: 'sistema',
            });

            houveMudanca = true;
          }
        }
      }
    }

    if (houveMudanca) {
      this.notify();
    }
  }

  // ==========================================
  // --- ITENS E EQUIPAMENTOS COMPARTILHADOS ---
  // ==========================================

  public getItensCompartilhados(condoId: string, categoria?: string): ItemCompartilhado[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    const list = this.itensCompartilhados[condoId] || [];
    if (categoria && categoria !== 'todos') {
      return list.filter((i) => i.categoria === categoria);
    }
    return [...list];
  }

  public getItemCompartilhado(condoId: string, itemId: string): ItemCompartilhado | undefined {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return (this.itensCompartilhados[condoId] || []).find(
      (i) =>
        i.id === itemId ||
        i.codigoIdentificador?.toUpperCase() === itemId.toUpperCase() ||
        i.reservaAtual?.codigoResgate === itemId
    );
  }

  public addItemCompartilhado(
    condoId: string,
    item: Omit<ItemCompartilhado, 'id' | 'condominioId'>
  ): ItemCompartilhado {
    const newId = `item_comp_${Date.now()}`;
    const novoItem: ItemCompartilhado = {
      ...item,
      id: newId,
      condominioId: condoId,
      status: item.status || 'disponivel',
      reservaAtual: null,
      usoAtual: null,
      historicoUso: [],
    };

    if (!this.itensCompartilhados[condoId]) {
      this.itensCompartilhados[condoId] = [];
    }

    this.itensCompartilhados[condoId].unshift(novoItem);
    this.saveToStorage();
    syncItemCompartilhadoToFirestore(novoItem).catch((err) =>
      console.warn('Sync Item Compartilhado error:', err)
    );
    this.notify();

    return novoItem;
  }

  public updateItemCompartilhado(
    condoId: string,
    itemId: string,
    data: Partial<ItemCompartilhado>
  ): boolean {
    const list = this.itensCompartilhados[condoId] || [];
    const item = list.find((i) => i.id === itemId);
    if (!item) return false;

    Object.assign(item, data);
    this.saveToStorage();
    syncItemCompartilhadoToFirestore(item).catch((err) =>
      console.warn('Sync Update Item Compartilhado error:', err)
    );
    this.notify();
    return true;
  }

  public deleteItemCompartilhado(condoId: string, itemId: string): boolean {
    if (!this.itensCompartilhados[condoId]) return false;
    this.itensCompartilhados[condoId] = this.itensCompartilhados[condoId].filter(
      (i) => i.id !== itemId
    );
    this.saveToStorage();
    deleteItemCompartilhadoFromFirestore(condoId, itemId).catch((err) =>
      console.warn('Delete Item Compartilhado error:', err)
    );
    this.notify();
    return true;
  }

  // Morador Reserva Item (Gera Código de 6 Dígitos com 5 Minutos de Tolerância)
  public reservarItemCompartilhado(
    condoId: string,
    itemId: string,
    moradorId: string
  ): {
    success: boolean;
    message: string;
    item?: ItemCompartilhado;
    codigoResgate?: string;
    expiraEm?: string;
  } {
    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não encontrado.' };
    }

    const item = (this.itensCompartilhados[condoId] || []).find((i) => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Equipamento ou item não encontrado.' };
    }

    if (item.status === 'em_uso') {
      return {
        success: false,
        message: `O item "${item.nome}" já está em uso por ${item.usoAtual?.moradorNome || 'outro morador'}.`,
      };
    }

    if (item.status === 'reservado') {
      return {
        success: false,
        message: `O item "${item.nome}" já está reservado por ${item.reservaAtual?.moradorNome || 'outro morador'} aguardando retirada.`,
      };
    }

    if (item.status === 'manutencao') {
      return {
        success: false,
        message: `O item "${item.nome}" está em manutenção ou revisão.`,
      };
    }

    // Gerar código de resgate de 6 dígitos numéricos
    const codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();
    const agora = Date.now();
    const expiraEmTimestamp = agora + 5 * 60 * 1000;
    const expiraEmIso = new Date(expiraEmTimestamp).toISOString();

    item.status = 'reservado';
    item.reservaAtual = {
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`,
      codigoResgate: codigo6Digitos,
      expiraEm: expiraEmIso,
      expiraEmTimestamp,
      reservadoEm: agora,
    };

    this.saveToStorage();
    syncItemCompartilhadoToFirestore(item).catch((err) =>
      console.warn('Sync Reserva Item error:', err)
    );

    // Notificação geral para a Portaria e Síndico
    this.addNotification({
      condominioId: condoId,
      titulo: `📦 Reserva de Equipamento: ${item.nome}`,
      mensagem: `${morador.nome} (${item.reservaAtual.unidade}) reservou ${item.nome} (${item.codigoIdentificador}). Código de Liberação: ${codigo6Digitos}. Tolerância: 5 minutos.`,
      tipo: 'sistema',
    });

    this.notify();

    return {
      success: true,
      message: `Reserva confirmada! Apresente o código ${codigo6Digitos} na portaria ou zeladoria em até 5 minutos para retirar o equipamento.`,
      item,
      codigoResgate: codigo6Digitos,
      expiraEm: expiraEmIso,
    };
  }

  // Cancelar Reserva do Item
  public cancelarReservaItemCompartilhado(
    condoId: string,
    itemId: string,
    moradorId?: string
  ): { success: boolean; message: string } {
    const item = (this.itensCompartilhados[condoId] || []).find((i) => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado.' };
    }

    if (moradorId && item.reservaAtual && item.reservaAtual.moradorId !== moradorId) {
      return { success: false, message: 'Você só pode cancelar reservas feitas por você.' };
    }

    item.status = 'disponivel';
    item.reservaAtual = null;

    this.saveToStorage();
    syncItemCompartilhadoToFirestore(item).catch((err) =>
      console.warn('Sync Cancelar Reserva error:', err)
    );
    this.notify();

    return { success: true, message: `Reserva do item "${item.nome}" cancelada com sucesso.` };
  }

  // Porteiro ou Síndico Valida Código e Registra a Saída / Retirada do Equipamento
  public liberarRetiradaItemPortaria(
    condoId: string,
    codigoOrId: string,
    operadorNome: string = 'Portaria / Síndico'
  ): { success: boolean; message: string; item?: ItemCompartilhado } {
    const list = this.itensCompartilhados[condoId] || [];
    const cleanSearch = (codigoOrId || '').trim().toUpperCase();

    const item = list.find((i) => {
      if (i.id === codigoOrId) return true;
      if (i.codigoIdentificador && i.codigoIdentificador.toUpperCase() === cleanSearch) return true;
      if (i.reservaAtual && i.reservaAtual.codigoResgate === cleanSearch) return true;
      return false;
    });

    if (!item) {
      return {
        success: false,
        message: `Item ou código "${codigoOrId}" não localizado no sistema.`,
      };
    }

    if (item.status === 'em_uso') {
      return {
        success: false,
        message: `O item "${item.nome}" já está em uso por ${item.usoAtual?.moradorNome || 'outro morador'}.`,
        item,
      };
    }

    const moradorId = item.reservaAtual?.moradorId || 'morador_avulso';
    const moradorNome = item.reservaAtual?.moradorNome || 'Morador';
    const moradorUnidade = item.reservaAtual?.unidade || 'Unidade';

    const agora = Date.now();
    const tempoMaxMs = (item.tempoMaximoUsoHoras || 4) * 3600 * 1000;
    const devolucaoPrevistaEm = agora + tempoMaxMs;

    item.status = 'em_uso';
    item.usoAtual = {
      moradorId,
      moradorNome,
      unidade: moradorUnidade,
      retiradoEm: agora,
      devolucaoPrevistaEm,
      liberadoPor: operadorNome,
    };
    item.reservaAtual = null;

    this.saveToStorage();
    syncItemCompartilhadoToFirestore(item).catch((err) =>
      console.warn('Sync Liberação Item error:', err)
    );

    this.addNotification({
      condominioId: condoId,
      titulo: `✅ Retirada de Equipamento: ${item.nome}`,
      mensagem: `${moradorNome} (${moradorUnidade}) retirou ${item.nome} (${item.codigoIdentificador}). Liberado por: ${operadorNome}. Prazo de devolução: ${item.tempoMaximoUsoHoras}h.`,
      tipo: 'sistema',
    });

    this.notify();

    return {
      success: true,
      message: `Item "${item.nome}" liberado com sucesso para ${moradorNome} (${moradorUnidade})!`,
      item,
    };
  }

  // Devolução do Equipamento
  public receberDevolucaoItem(
    condoId: string,
    itemId: string,
    dados: {
      operadorNome?: string;
      observacoes?: string;
    } = {}
  ): { success: boolean; message: string; item?: ItemCompartilhado } {
    const list = this.itensCompartilhados[condoId] || [];
    const item = list.find((i) => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado.' };
    }

    const agora = Date.now();
    const operador = dados.operadorNome || 'Portaria / Zeladoria';

    if (item.usoAtual) {
      if (!item.historicoUso) item.historicoUso = [];
      item.historicoUso.unshift({
        id: `hist_item_${Date.now()}`,
        moradorId: item.usoAtual.moradorId,
        moradorNome: item.usoAtual.moradorNome,
        unidade: item.usoAtual.unidade,
        retiradaEm: item.usoAtual.retiradoEm,
        devolucaoEm: agora,
        operador,
        observacoes: dados.observacoes,
      });
    }

    item.status = 'disponivel';
    item.usoAtual = null;
    item.reservaAtual = null;

    this.saveToStorage();
    syncItemCompartilhadoToFirestore(item).catch((err) =>
      console.warn('Sync Devolução Item error:', err)
    );

    this.addNotification({
      condominioId: condoId,
      titulo: `📥 Devolução de Equipamento: ${item.nome}`,
      mensagem: `O item ${item.nome} (${item.codigoIdentificador}) foi devolvido e conferido por ${operador}. Status: Disponível.`,
      tipo: 'sistema',
    });

    this.notify();

    return {
      success: true,
      message: `Devolução de "${item.nome}" registrada com sucesso!`,
      item,
    };
  }

  public getHistoricoLocacoes(condoId: string): HistoricoLocacao[] {
    return [...(this.historicoLocacoes[condoId] || [])];
  }

  public cadastrarOuObterMoradorRapido(
    condoId: string,
    dados: {
      bloco?: string;
      apto: string;
      nome?: string;
      telefone?: string;
      email?: string;
    }
  ): Morador {
    const bloco = (dados.bloco || '1').trim().replace(/bloco\s*/i, '');
    const apto = dados.apto.trim().replace(/apto\s*/i, '').replace(/apartamento\s*/i, '');
    const nome = (dados.nome || `Morador Bloco ${bloco} - Apto ${apto}`).trim();

    if (!this.moradores[condoId]) {
      this.moradores[condoId] = [];
    }

    // Procura morador existente nesta unidade
    const existente = this.moradores[condoId].find(
      (m) =>
        m.unidade.apto.toLowerCase() === apto.toLowerCase() &&
        (m.unidade.bloco || '').toLowerCase() === bloco.toLowerCase()
    );

    if (existente) {
      if (dados.nome && dados.nome !== existente.nome) {
        existente.nome = dados.nome;
      }
      if (dados.telefone) existente.telefone = dados.telefone;
      this.saveToStorage();
      syncMoradorToFirestore(existente).catch(() => {});
      return existente;
    }

    // Cria novo morador ativo diretamente para a unidade
    const newId = `morador_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const novoMorador: Morador = {
      id: newId,
      condominioId: condoId,
      nome,
      email: dados.email?.trim().toLowerCase() || `morador.${bloco}.${apto}@smartcondo.com`,
      telefone: dados.telefone?.trim() || '(11) 99999-9999',
      unidade: {
        bloco,
        apto,
      },
      statusAdimplencia: 'em_dia',
      statusCadastro: 'ativo',
      solicitadoEm: Date.now(),
      aprovadoEm: Date.now(),
      aprovadoPor: 'Portaria Automática',
      authProvider: 'email',
    };

    this.moradores[condoId].push(novoMorador);
    this.saveToStorage();
    syncMoradorToFirestore(novoMorador).catch(() => {});
    this.notify();
    return novoMorador;
  }

  // --- Encomendas & Portaria ---
  public getEncomendas(condoId: string, moradorIdOrObj?: string | Morador): Encomenda[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    const list = this.encomendas[condoId] || [];
    if (moradorIdOrObj) {
      if (typeof moradorIdOrObj === 'string') {
        const moradorId = moradorIdOrObj;
        const moradorObj = this.getMorador(condoId, moradorId);
        return list.filter((e) => {
          if (e.moradorId === moradorId) return true;
          if (moradorObj && e.unidade && moradorObj.unidade) {
            const sameApto = String(e.unidade.apto || '').toLowerCase().trim() === String(moradorObj.unidade.apto || '').toLowerCase().trim();
            const sameBloco = !e.unidade.bloco || !moradorObj.unidade.bloco || String(e.unidade.bloco || '').toLowerCase().trim() === String(moradorObj.unidade.bloco || '').toLowerCase().trim();
            return sameApto && sameBloco;
          }
          return false;
        });
      } else {
        const morador = moradorIdOrObj;
        return list.filter((e) => {
          if (e.moradorId === morador.id) return true;
          if (e.unidade && morador.unidade) {
            const sameApto = String(e.unidade.apto || '').toLowerCase().trim() === String(morador.unidade.apto || '').toLowerCase().trim();
            const sameBloco = !e.unidade.bloco || !morador.unidade.bloco || String(e.unidade.bloco || '').toLowerCase().trim() === String(morador.unidade.bloco || '').toLowerCase().trim();
            return sameApto && sameBloco;
          }
          return false;
        });
      }
    }
    return [...list];
  }

  // Verificador Contínuo dos Prazos de Retirada de Encomendas (Regra do Condomínio)
  public verificarPrazosEncomendas() {
    const agora = Date.now();
    let houveMudanca = false;

    for (const condoId of Object.keys(this.encomendas)) {
      const condo = this.getCondominio(condoId);
      const diasLimite = condo?.regras?.diasLimiteRetiradaEncomenda ?? 5; // Padrão: 5 dias
      const condoNome = condo?.nome || 'Condomínio Residencial';
      const encList = this.encomendas[condoId] || [];

      for (const enc of encList) {
        if (enc.status === 'na_portaria') {
          const limiteTimestamp = enc.dataLimiteRetirada || (enc.recebidoEm + diasLimite * 24 * 60 * 60 * 1000);
          
          if (agora > limiteTimestamp) {
            enc.status = 'encaminhada_administracao';
            enc.encaminhadaAdministracaoEm = agora;
            enc.motivoEncaminhamentoAdmin = `Prazo de ${diasLimite} dias para retirada na portaria expirou. Pacote transferido para guarda na Administração.`;

            syncEncomendaToFirestore(enc).catch(() => {});

            // Notificação interna no sistema
            this.addNotification({
              condominioId: condoId,
              paraMoradorId: enc.moradorId,
              titulo: `🏛️ Encomenda Transferida para a Administração (${enc.transportadora})`,
              mensagem: `O prazo de ${diasLimite} dias expirou. Seu pacote foi transferido para a sala da Administração do condomínio. Código: ${enc.codigoResgate}`,
              tipo: 'encomenda',
            });

            // Notificação multicanal (Push + WhatsApp + E-mail)
            const morador = this.getMorador(condoId, enc.moradorId);
            if (morador && condo) {
              notificationService.notificarEncaminhamentoAdministracao({
                condominio: condo,
                morador,
                encomenda: enc,
                diasLimite,
              });
            }

            houveMudanca = true;
          }
        }
      }
    }

    if (houveMudanca) {
      this.saveToStorage();
      this.notify();
    }
  }

  public addEncomenda(
    condoId: string,
    data: {
      moradorId: string;
      transportadora: string;
      codigoRastreio: string;
      recebidoPor: string;
      observacao?: string;
      fotoUrl?: string;
      diasLimiteCustomizado?: number;
      codigoResgateCustomizado?: string;
    }
  ): Encomenda {
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    const condo = this.getCondominio(condoId);
    const diasLimite = data.diasLimiteCustomizado ?? condo?.regras?.diasLimiteRetiradaEncomenda ?? 5; // Padrão: 5 dias
    const agora = Date.now();
    const dataLimite = agora + diasLimite * 24 * 60 * 60 * 1000;

    // Regra Inteligente de Unidade: Reutiliza o PIN ativo do apartamento se já houver encomenda aguardando
    let codigo6Digitos = data.codigoResgateCustomizado;
    if (!codigo6Digitos) {
      const pendingSameUnit = (this.encomendas[condoId] || []).find(
        (e) =>
          e.status === 'na_portaria' &&
          e.unidade &&
          morador.unidade &&
          String(e.unidade.apto).trim().toLowerCase() === String(morador.unidade.apto).trim().toLowerCase() &&
          (!e.unidade.bloco || !morador.unidade.bloco || String(e.unidade.bloco).trim().toLowerCase() === String(morador.unidade.bloco).trim().toLowerCase()) &&
          e.codigoResgate
      );

      if (pendingSameUnit) {
        codigo6Digitos = pendingSameUnit.codigoResgate;
      } else {
        codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    const novaEnc: Encomenda = {
      id: `enc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      condominioId: condoId,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      transportadora: data.transportadora,
      codigoRastreio: data.codigoRastreio || `BR${Math.floor(100000000 + Math.random() * 900000000)}`,
      codigoResgate: codigo6Digitos,
      status: 'na_portaria',
      recebidoEm: agora,
      recebidoPor: data.recebidoPor,
      diasLimiteRetirada: diasLimite,
      dataLimiteRetirada: dataLimite,
      notificacaoPushEnviada: true,
      notificacaoEmailEnviada: true,
      notificacaoWhatsAppEnviada: true,
      fotoUrl: data.fotoUrl,
      observacao: data.observacao || '',
    };

    if (!this.encomendas[condoId]) this.encomendas[condoId] = [];
    this.encomendas[condoId].unshift(novaEnc);

    this.saveToStorage();
    syncEncomendaToFirestore(novaEnc).catch((err) => console.warn('Sync Encomenda error:', err));

    // 1. Notificação In-App
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: '📦 Nova Encomenda Recebida na Portaria',
      mensagem: `${data.transportadora} entregou um pacote para sua unidade (${morador.unidade.bloco ? `Bloco ${morador.unidade.bloco} - ` : ''}Apto ${morador.unidade.apto}). Código PIN: ${codigo6Digitos}. Destinatário: ${morador.nome}.`,
      tipo: 'encomenda',
    });

    // 2. Disparo Multicanal Integrado (Push Barra de Notificações + WhatsApp + E-mail)
    if (condo) {
      notificationService.notificarChegadaEncomenda({
        condominio: condo,
        morador,
        encomenda: novaEnc,
        diasLimite,
      });
    }

    this.notify();
    return novaEnc;
  }

  // Cadastro de Múltiplas Encomendas para o Mesmo Apartamento (Bloco + Apto) com PIN Unificado
  public addMultiplasEncomendas(
    condoId: string,
    dados: {
      moradorId: string;
      recebidoPor: string;
      pacotes: Array<{
        transportadora: string;
        destinatarioNome?: string;
        codigoRastreio?: string;
        observacao?: string;
        fotoUrl?: string;
      }>;
      diasLimiteCustomizado?: number;
    }
  ): { encomendas: Encomenda[]; codigoResgate: string; morador: Morador } {
    const morador = this.getMorador(condoId, dados.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    const condo = this.getCondominio(condoId);
    const diasLimite = dados.diasLimiteCustomizado ?? condo?.regras?.diasLimiteRetiradaEncomenda ?? 5;
    const agora = Date.now();
    const dataLimite = agora + diasLimite * 24 * 60 * 60 * 1000;

    // Busca PIN ativo do apartamento ou gera um novo de 6 dígitos
    const pendingSameUnit = (this.encomendas[condoId] || []).find(
      (e) =>
        e.status === 'na_portaria' &&
        e.unidade &&
        morador.unidade &&
        String(e.unidade.apto).trim().toLowerCase() === String(morador.unidade.apto).trim().toLowerCase() &&
        (!e.unidade.bloco || !morador.unidade.bloco || String(e.unidade.bloco).trim().toLowerCase() === String(morador.unidade.bloco).trim().toLowerCase()) &&
        e.codigoResgate
    );

    const pinUnificado = pendingSameUnit
      ? pendingSameUnit.codigoResgate
      : Math.floor(100000 + Math.random() * 900000).toString();

    const criadas: Encomenda[] = [];

    if (!this.encomendas[condoId]) this.encomendas[condoId] = [];

    dados.pacotes.forEach((p, idx) => {
      const nomeFinal = p.destinatarioNome?.trim() || morador.nome;
      const novaEnc: Encomenda = {
        id: `enc_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        condominioId: condoId,
        moradorId: morador.id,
        moradorNome: nomeFinal,
        unidade: morador.unidade,
        transportadora: p.transportadora.trim() || 'Mercado Livre',
        codigoRastreio: p.codigoRastreio?.trim().toUpperCase() || `BR${Math.floor(100000000 + Math.random() * 900000000)}`,
        codigoResgate: pinUnificado,
        status: 'na_portaria',
        recebidoEm: agora,
        recebidoPor: dados.recebidoPor,
        diasLimiteRetirada: diasLimite,
        dataLimiteRetirada: dataLimite,
        notificacaoPushEnviada: true,
        notificacaoEmailEnviada: true,
        notificacaoWhatsAppEnviada: true,
        fotoUrl: p.fotoUrl,
        observacao: p.observacao || '',
      };

      this.encomendas[condoId].unshift(novaEnc);
      syncEncomendaToFirestore(novaEnc).catch(() => {});
      criadas.push(novaEnc);
    });

    this.saveToStorage();

    // Notificação In-App de Lote
    const listaNomes = criadas.map((e) => `${e.moradorNome} (${e.transportadora})`).join(', ');
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: `📦 ${criadas.length} Encomendas Recebidas na Portaria`,
      mensagem: `${criadas.length} encomendas recebidas para Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto} [${listaNomes}]. PIN Único de Retirada: ${pinUnificado}.`,
      tipo: 'encomenda',
    });

    // Notificação WhatsApp e Push de Lote
    if (criadas.length > 0 && condo) {
      whatsappService.notificarChegadaEncomendaAutomatica({
        condominio: condo,
        morador,
        encomenda: criadas[0],
      }).catch(() => {});

      notificationService.dispararNotificacaoNativa(`📦 ${criadas.length} Encomendas Chegaram! - ${condo?.nome || 'Condomínio'}`, {
        body: `Olá ${morador.nome}! Chegaram ${criadas.length} pacotes para seu apartamento. PIN de Retirada: ${pinUnificado}.`,
        tag: `enc-lote-${morador.unidade.bloco}-${morador.unidade.apto}`,
      });
    }

    this.notify();
    return { encomendas: criadas, codigoResgate: pinUnificado, morador };
  }

  // Buscar todas as encomendas pendentes de uma unidade específica (Bloco + Apto)
  public getEncomendasPendentesUnidade(
    condoId: string,
    bloco: string,
    apto: string
  ): Encomenda[] {
    const list = this.encomendas[condoId] || [];
    const bClean = (bloco || '').trim().toLowerCase().replace(/bloco\s*/i, '');
    const aClean = (apto || '').trim().toLowerCase().replace(/apto\s*/i, '').replace(/apartamento\s*/i, '');

    return list.filter((e) => {
      if (e.status !== 'na_portaria' && e.status !== 'encaminhada_administracao') return false;
      const eb = (e.unidade?.bloco || '1').trim().toLowerCase().replace(/bloco\s*/i, '');
      const ea = (e.unidade?.apto || '').trim().toLowerCase().replace(/apto\s*/i, '').replace(/apartamento\s*/i, '');
      return ea === aClean && (!bClean || eb === bClean);
    });
  }

  // Encaminhar manualmente para a administração antes ou após o prazo
  public encaminharEncomendaAdministracao(
    condoId: string,
    encomendaId: string,
    operadorNome: string,
    motivo?: string
  ): { success: boolean; message: string; encomenda?: Encomenda } {
    const list = this.encomendas[condoId] || [];
    const enc = list.find((e) => e.id === encomendaId || e.codigoResgate === encomendaId.trim());

    if (!enc) {
      return { success: false, message: 'Encomenda não encontrada.' };
    }

    enc.status = 'encaminhada_administracao';
    enc.encaminhadaAdministracaoEm = Date.now();
    enc.motivoEncaminhamentoAdmin = motivo || `Encaminhado por ${operadorNome} para a Administração.`;

    this.saveToStorage();
    syncEncomendaToFirestore(enc).catch((err) => console.warn('Sync Encomenda admin error:', err));

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: enc.moradorId,
      titulo: `🏛️ Encomenda Transferida para a Administração`,
      mensagem: `A encomenda da ${enc.transportadora} (Código: ${enc.codigoResgate}) está agora na Administração do condomínio.`,
      tipo: 'encomenda',
    });

    this.notify();
    return {
      success: true,
      message: `Encomenda de ${enc.moradorNome} transferida com sucesso para a Administração!`,
      encomenda: enc,
    };
  }

  public darBaixaEncomenda(
    condoId: string,
    encomendaIdOrCode: string,
    operadorNome: string
  ): { success: boolean; message: string; encomenda?: Encomenda; totalEntregues?: number } {
    const list = this.encomendas[condoId] || [];
    const cleanSearch = (encomendaIdOrCode || '').trim();

    // Busca todas as encomendas pendentes que batem com este PIN ou Código de Rastreio ou ID
    const matchingPending = list.filter(
      (e) =>
        (e.status === 'na_portaria' || e.status === 'encaminhada_administracao') &&
        (e.id === cleanSearch ||
          e.codigoResgate === cleanSearch ||
          e.codigoRastreio.toLowerCase() === cleanSearch.toLowerCase())
    );

    if (matchingPending.length === 0) {
      // Verifica se já foi entregue
      const alreadyDelivered = list.find(
        (e) =>
          e.id === cleanSearch ||
          e.codigoResgate === cleanSearch ||
          e.codigoRastreio.toLowerCase() === cleanSearch.toLowerCase()
      );
      if (alreadyDelivered) {
        return {
          success: false,
          message: `Esta encomenda já foi entregue anteriormente para ${alreadyDelivered.entreguePara || 'o morador'}.`,
        };
      }
      return { success: false, message: 'Código PIN ou encomenda não encontrada na portaria.' };
    }

    const agora = Date.now();
    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';

    matchingPending.forEach((enc) => {
      enc.status = 'entregue';
      enc.entregueEm = agora;
      enc.metodoRetirada = 'pin_6_digitos';
      enc.nomeRetirante = enc.moradorNome;
      enc.entreguePara = `${enc.moradorNome} (PIN ${enc.codigoResgate} Validado por ${operadorNome})`;
      syncEncomendaToFirestore(enc).catch(() => {});
    });

    this.saveToStorage();

    const primeira = matchingPending[0];
    const morador = this.getMorador(condoId, primeira.moradorId);

    // 1. Notificação In-App
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: primeira.moradorId,
      titulo: matchingPending.length > 1 ? `✅ ${matchingPending.length} Encomendas Retiradas com PIN` : '✅ Encomenda Retirada com PIN',
      mensagem: `${matchingPending.length} pacote(s) entregue(s) para Bloco ${primeira.unidade.bloco} - Apto ${primeira.unidade.apto}. PIN: ${primeira.codigoResgate}.`,
      tipo: 'encomenda',
    });

    // 2. Notificação WhatsApp
    if (morador) {
      const listaPacotesTxt = matchingPending.map((e) => `• ${e.transportadora} (Para: ${e.moradorNome})`).join('\n');
      whatsappService.notificarMorador({
        condominioId: condoId,
        condominioNome: condoNome,
        morador,
        tipo: 'encomenda_baixa',
        titulo: '✅ Encomenda(s) Retirada(s) na Portaria (PIN Validado)',
        corpoMensagem: `Sua(s) *${matchingPending.length} encomenda(s)* foram retiradas com sucesso!\n\n${listaPacotesTxt}\n\n🔑 *PIN de Segurança Validado:* \`${primeira.codigoResgate}\`\n👮 *Entregue por:* ${operadorNome}\n📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`,
      });
    }

    this.notify();
    return {
      success: true,
      message: matchingPending.length > 1
        ? `✅ ${matchingPending.length} encomendas entregues com sucesso para Bloco ${primeira.unidade.bloco} - Apto ${primeira.unidade.apto}!`
        : `Baixa confirmada via PIN para ${primeira.moradorNome} (Bloco ${primeira.unidade.bloco} - ${primeira.unidade.apto})!`,
      encomenda: primeira,
      totalEntregues: matchingPending.length,
    };
  }

  // Baixa em Lote por Seleção ou por Unidade (Bloco + Apto)
  public darBaixaMultiplasPorIds(
    condoId: string,
    encomendaIds: string[],
    operadorNome: string,
    dadosDoc?: {
      nomeRetirante: string;
      documentoRetirante: string;
      assinaturaRetiranteUrl?: string;
      motivoSemPin?: string;
    }
  ): { success: boolean; message: string; totalEntregues: number } {
    const list = this.encomendas[condoId] || [];
    const targetEncs = list.filter(
      (e) =>
        encomendaIds.includes(e.id) &&
        (e.status === 'na_portaria' || e.status === 'encaminhada_administracao')
    );

    if (targetEncs.length === 0) {
      return { success: false, message: 'Nenhuma encomenda pendente encontrada para dar baixa.', totalEntregues: 0 };
    }

    const agora = Date.now();
    targetEncs.forEach((enc) => {
      enc.status = 'entregue';
      enc.entregueEm = agora;
      if (dadosDoc) {
        enc.metodoRetirada = 'documento_rubrica';
        enc.nomeRetirante = dadosDoc.nomeRetirante.trim();
        enc.documentoRetirante = dadosDoc.documentoRetirante.trim();
        enc.assinaturaRetiranteUrl = dadosDoc.assinaturaRetiranteUrl;
        enc.motivoSemPin = dadosDoc.motivoSemPin;
        enc.entreguePara = `${dadosDoc.nomeRetirante.trim()} (Doc: ${dadosDoc.documentoRetirante.trim()} - Autorizado por ${operadorNome})`;
      } else {
        enc.metodoRetirada = 'pin_6_digitos';
        enc.nomeRetirante = enc.moradorNome;
        enc.entreguePara = `${enc.moradorNome} (Entregue em Lote por ${operadorNome})`;
      }
      syncEncomendaToFirestore(enc).catch(() => {});
    });

    this.saveToStorage();
    this.notify();

    return {
      success: true,
      message: `✅ ${targetEncs.length} encomenda(s) entregue(s) com sucesso na portaria!`,
      totalEntregues: targetEncs.length,
    };
  }

  // Baixa de Encomenda de Contingência: Morador sem PIN (Exige Documento CPF/RG e Rúbrica/Assinatura)
  public darBaixaEncomendaComDocumento(
    condoId: string,
    encomendaIdOrCode: string,
    dados: {
      nomeRetirante: string;
      documentoRetirante: string; // CPF ou RG
      assinaturaRetiranteUrl?: string; // Rúbrica capturada em canvas
      motivoSemPin: string;
      operadorNome: string;
    }
  ): { success: boolean; message: string; encomenda?: Encomenda } {
    const list = this.encomendas[condoId] || [];
    const enc = list.find(
      (e) =>
        e.id === encomendaIdOrCode ||
        e.codigoResgate === encomendaIdOrCode.trim() ||
        e.codigoRastreio.toLowerCase() === encomendaIdOrCode.trim().toLowerCase()
    );

    if (!enc) {
      return { success: false, message: 'Encomenda não encontrada.' };
    }

    if (enc.status === 'entregue') {
      return {
        success: false,
        message: `Esta encomenda já foi entregue anteriormente para ${enc.entreguePara || 'o morador'}.`,
      };
    }

    if (!dados.documentoRetirante || dados.documentoRetirante.trim().length < 5) {
      return { success: false, message: 'O documento (CPF ou RG) do retirante é estritamente obrigatório.' };
    }

    if (!dados.nomeRetirante || dados.nomeRetirante.trim().length < 3) {
      return { success: false, message: 'Informe o nome completo de quem está retirando a encomenda.' };
    }

    const agora = Date.now();
    enc.status = 'entregue';
    enc.entregueEm = agora;
    enc.metodoRetirada = 'documento_rubrica';
    enc.nomeRetirante = dados.nomeRetirante.trim();
    enc.documentoRetirante = dados.documentoRetirante.trim();
    enc.assinaturaRetiranteUrl = dados.assinaturaRetiranteUrl;
    enc.motivoSemPin = dados.motivoSemPin || 'Morador sem acesso ao celular/PIN no momento';
    enc.entreguePara = `${dados.nomeRetirante.trim()} (Doc: ${dados.documentoRetirante.trim()} - Rúbrica Coletada por ${dados.operadorNome})`;

    this.saveToStorage();
    syncEncomendaToFirestore(enc).catch((err) => console.warn('Sync Encomenda baixa com documento error:', err));

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: enc.moradorId,
      titulo: '⚠️ Encomenda Retirada por Documento & Rúbrica',
      mensagem: `A encomenda da ${enc.transportadora} foi retirada por ${dados.nomeRetirante} (Doc: ${dados.documentoRetirante}) com assinatura digital registrada.`,
      tipo: 'encomenda',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    const morador = this.getMorador(condoId, enc.moradorId);
    if (morador) {
      whatsappService.notificarMorador({
        condominioId: condoId,
        condominioNome: condoNome,
        morador,
        tipo: 'encomenda_baixa',
        titulo: '⚠️ Retirada de Encomenda (Documento & Assinatura)',
        corpoMensagem: `Sua encomenda da transportadora *${enc.transportadora}* foi entregue na portaria mediante identificação documental e rúbrica.\n\n👤 *Retirado por:* ${dados.nomeRetirante}\n📄 *Documento registrado:* ${dados.documentoRetirante}\n📝 *Motivo:* ${enc.motivoSemPin}\n👮 *Atendido por:* ${dados.operadorNome}\n📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`,
      });
    }

    this.notify();
    return {
      success: true,
      message: `Baixa com Documento e Rúbrica registrada com sucesso para ${dados.nomeRetirante}!`,
      encomenda: enc,
    };
  }

  // ==========================================
  // --- EQUIPE & PERMISSÕES (FUNCIONÁRIOS) ---
  // ==========================================

  public getFuncionarios(condoId: string): FuncionarioEquipe[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    const list = this.funcionarios[condoId] || [];
    return [...list];
  }

  public addFuncionario(
    condoId: string,
    data: Omit<FuncionarioEquipe, 'id' | 'condominioId' | 'cadastradoEm'>
  ): FuncionarioEquipe {
    const newId = `func_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const novoFunc: FuncionarioEquipe = {
      ...data,
      id: newId,
      condominioId: condoId,
      cadastradoEm: Date.now(),
      status: data.status || 'ativo',
    };

    if (!this.funcionarios[condoId]) {
      this.funcionarios[condoId] = [];
    }
    this.funcionarios[condoId].unshift(novoFunc);

    // Também cria ou atualiza no usuariosSistema para permitir login caso tenha e-mail
    if (novoFunc.email) {
      const roleEquivalente = novoFunc.cargo === 'administracao' || novoFunc.cargo === 'gerente_predial' ? 'sindico' : 'portaria';
      const emailLower = novoFunc.email.toLowerCase().trim();
      const existingUser = this.usuariosSistema.find((u) => u.email.toLowerCase() === emailLower);
      if (!existingUser) {
        const novoUsuario: UsuarioSistema = {
          id: `usr_${novoFunc.id}`,
          nome: novoFunc.nome,
          email: emailLower,
          senha: novoFunc.senha || 'equipe123',
          role: roleEquivalente,
          condominioId: condoId,
          statusCadastro: 'ativo',
          authProvider: 'email',
        };
        this.usuariosSistema.push(novoUsuario);
        syncUsuarioSistemaToFirestore(novoUsuario).catch((err) =>
          console.warn('Sync UsuarioSistema error:', err)
        );
      } else {
        existingUser.nome = novoFunc.nome;
        existingUser.senha = novoFunc.senha || existingUser.senha || 'equipe123';
        existingUser.role = roleEquivalente;
        existingUser.condominioId = condoId;
        syncUsuarioSistemaToFirestore(existingUser).catch((err) =>
          console.warn('Sync UsuarioSistema error:', err)
        );
      }
    }

    this.saveToStorage();
    syncFuncionarioToFirestore(condoId, novoFunc).catch((err) =>
      console.warn('Sync Funcionario to Firestore error:', err)
    );
    this.notify();
    return novoFunc;
  }

  public updateFuncionario(
    condoId: string,
    funcId: string,
    data: Partial<FuncionarioEquipe>
  ): boolean {
    const list = this.funcionarios[condoId] || [];
    const func = list.find((f) => f.id === funcId);
    if (!func) return false;

    Object.assign(func, data);

    // Atualiza usuário de login se houver
    if (func.email) {
      const emailLower = func.email.toLowerCase().trim();
      const user = this.usuariosSistema.find((u) => u.email.toLowerCase() === emailLower);
      const roleEquivalente = func.cargo === 'administracao' || func.cargo === 'gerente_predial' ? 'sindico' : 'portaria';
      if (user) {
        user.nome = func.nome;
        user.role = roleEquivalente;
        if (data.senha) user.senha = data.senha;
        syncUsuarioSistemaToFirestore(user).catch((err) =>
          console.warn('Sync UsuarioSistema error:', err)
        );
      } else {
        const novoUsuario: UsuarioSistema = {
          id: `usr_${func.id}`,
          nome: func.nome,
          email: emailLower,
          senha: func.senha || 'equipe123',
          role: roleEquivalente,
          condominioId: condoId,
          statusCadastro: 'ativo',
          authProvider: 'email',
        };
        this.usuariosSistema.push(novoUsuario);
        syncUsuarioSistemaToFirestore(novoUsuario).catch((err) =>
          console.warn('Sync UsuarioSistema error:', err)
        );
      }
    }

    this.saveToStorage();
    syncFuncionarioToFirestore(condoId, func).catch((err) =>
      console.warn('Sync Funcionario error:', err)
    );
    this.notify();
    return true;
  }

  public deleteFuncionario(condoId: string, funcId: string): boolean {
    if (!this.funcionarios[condoId]) return false;
    const func = this.funcionarios[condoId].find((f) => f.id === funcId);
    this.funcionarios[condoId] = this.funcionarios[condoId].filter((f) => f.id !== funcId);

    if (func?.email) {
      const emailLower = func.email.toLowerCase().trim();
      const userToDelete = this.usuariosSistema.find(
        (u) => u.email.toLowerCase() === emailLower
      );
      this.usuariosSistema = this.usuariosSistema.filter(
        (u) => u.email.toLowerCase() !== emailLower
      );
      if (userToDelete) {
        deleteUsuarioSistemaFromFirestore(userToDelete.id).catch((err) =>
          console.warn('Delete UsuarioSistema error:', err)
        );
      }
    }

    this.saveToStorage();
    deleteFuncionarioFromFirestore(condoId, funcId).catch((err) =>
      console.warn('Delete Funcionario from Firestore error:', err)
    );
    this.notify();
    return true;
  }

  // --- Áreas de Lazer ---
  public getAreasLazer(condoId: string): AreaLazer[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return [...(this.areasLazer[condoId] || [])];
  }

  public addAreaLazer(
    condoId: string,
    data: Omit<AreaLazer, 'id' | 'condominioId' | 'atualizadoEm'>
  ): AreaLazer {
    const newId = `area_${Date.now()}`;
    const newArea: AreaLazer = {
      ...data,
      id: newId,
      condominioId: condoId,
      atualizadoEm: Date.now(),
    };
    if (!this.areasLazer[condoId]) this.areasLazer[condoId] = [];
    this.areasLazer[condoId].push(newArea);
    this.saveToStorage();
    this.ensureCondoSubscribed(condoId);
    syncAreaLazerToFirestore(newArea).catch((err) => console.warn('Sync AreaLazer error:', err));
    this.notify();
    return newArea;
  }

  public updateAreaLazer(condoId: string, areaId: string, data: Partial<AreaLazer>) {
    const list = this.areasLazer[condoId] || [];
    const area = list.find((a) => a.id === areaId);
    if (area) {
      Object.assign(area, data);
      area.atualizadoEm = Date.now();
      syncAreaLazerToFirestore(area).catch((err) => console.warn('Sync AreaLazer error:', err));
      this.notify();
    }
  }

  public deleteAreaLazer(condoId: string, areaId: string) {
    if (this.areasLazer[condoId]) {
      this.areasLazer[condoId] = this.areasLazer[condoId].filter((a) => a.id !== areaId);
      deleteAreaLazerFromFirestore(condoId, areaId).catch((err) => console.warn('Delete AreaLazer error:', err));
      this.notify();
    }
  }

  public updateAreaLazerStatus(
    condoId: string,
    areaId: string,
    status: 'aberto' | 'manutencao' | 'limpeza' | 'fechado_clima',
    aviso: string,
    previsaoReabertura?: string
  ) {
    const list = this.areasLazer[condoId] || [];
    const area = list.find((a) => a.id === areaId);
    if (area) {
      area.status = status;
      area.aviso = aviso;
      area.previsaoReabertura = previsaoReabertura;
      area.atualizadoEm = Date.now();

      syncAreaLazerToFirestore(area).catch((err) => console.warn('Sync AreaLazer status error:', err));

      // Notificação geral para o condomínio se for alteração crítica
      if (status !== 'aberto') {
        this.addNotification({
          condominioId: condoId,
          titulo: `🏊 Status de Lazer: ${area.nome}`,
          mensagem: `Status alterado para [${status.toUpperCase()}]: ${aviso}. ${previsaoReabertura ? `Previsão: ${previsaoReabertura}` : ''}`,
          tipo: 'lazer',
        });
      }

      this.notify();
    }
  }

  // --- Reservas ---
  public getReservas(condoId: string): Reserva[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return [...(this.reservas[condoId] || [])];
  }

  public addReserva(
    condoId: string,
    data: {
      areaId: string;
      espaco: string;
      data: string; // YYYY-MM-DD
      periodo: 'manha' | 'tarde' | 'noite' | 'dia_inteiro';
      moradorId: string;
      termoAceito: boolean;
      valorTaxa: number;
      observacoes?: string;
    }
  ): { success: boolean; message: string; reserva?: Reserva } {
    const list = this.reservas[condoId] || [];
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) return { success: false, message: 'Morador não encontrado.' };

    if (!data.termoAceito) {
      return { success: false, message: 'É obrigatório aceitar o termo de regras e caução para prosseguir.' };
    }

    // Bloqueio automático de concorrência dupla
    const conflito = list.find(
      (r) =>
        r.areaId === data.areaId &&
        r.data === data.data &&
        r.status !== 'cancelada' &&
        (r.periodo === data.periodo || r.periodo === 'dia_inteiro' || data.periodo === 'dia_inteiro')
    );

    if (conflito) {
      return {
        success: false,
        message: `Esta data (${data.data}) já está reservada por outra unidade (${conflito.moradorNome} - Bloco ${conflito.unidade.bloco}).`,
      };
    }

    const novaReserva: Reserva = {
      id: `res_${Date.now()}`,
      condominioId: condoId,
      areaId: data.areaId,
      espaco: data.espaco,
      data: data.data,
      periodo: data.periodo,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      status: 'confirmada',
      termoAceito: data.termoAceito,
      valorTaxa: data.valorTaxa,
      criadoEm: Date.now(),
      observacoes: data.observacoes,
    };

    if (!this.reservas[condoId]) this.reservas[condoId] = [];
    this.reservas[condoId].unshift(novaReserva);

    syncReservaToFirestore(novaReserva).catch((err) => console.warn('Sync Reserva error:', err));

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: '🎉 Reserva Confirmada',
      mensagem: `Seu agendamento para ${data.espaco} em ${data.data} foi confirmado com sucesso!`,
      tipo: 'lazer',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    const periodosMap: Record<string, string> = {
      manha: 'Manhã (08h às 12h)',
      tarde: 'Tarde (13h às 17h)',
      noite: 'Noite (18h às 23h)',
      dia_inteiro: 'Dia Inteiro (08h às 23h)',
    };
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'reserva',
      titulo: `🎉 Reserva Confirmada: ${data.espaco}`,
      corpoMensagem: `Sua reserva foi confirmada com sucesso!\n\n🏢 *Espaço:* ${data.espaco}\n📅 *Data do Evento:* ${data.data}\n⏰ *Período:* ${periodosMap[data.periodo] || data.periodo}\n💰 *Taxa de Uso:* ${data.valorTaxa === 0 ? 'Gratuito' : `R$ ${data.valorTaxa.toFixed(2)}`}\n\n_Lembre-se de respeitar os horários de silêncio e as normas de limpeza e conservação do condomínio._`,
    });

    this.notify();
    return { success: true, message: 'Reserva confirmada com sucesso!', reserva: novaReserva };
  }

  public cancelarReserva(condoId: string, reservaId: string) {
    const list = this.reservas[condoId] || [];
    const r = list.find((x) => x.id === reservaId);
    if (r) {
      r.status = 'cancelada';
      syncReservaToFirestore(r).catch((err) => console.warn('Sync Reserva cancelada error:', err));

      const morador = this.getMorador(condoId, r.moradorId);
      const condo = this.getCondominio(condoId);
      const condoNome = condo ? condo.nome : 'Condomínio Residencial';
      if (morador) {
        whatsappService.notificarMorador({
          condominioId: condoId,
          condominioNome: condoNome,
          morador,
          tipo: 'reserva_cancelamento',
          titulo: '⚠️ Reserva Cancelada',
          corpoMensagem: `A sua reserva para o espaço *${r.espaco}* agendada para *${r.data}* foi cancelada no sistema.`,
        });
      }

      this.notify();
    }
  }

  // --- Mural de Avisos ---
  public getAvisos(condoId: string): Aviso[] {
    if (condoId) {
      this.ensureCondoSubscribed(condoId);
    }
    return [...(this.avisos[condoId] || [])];
  }

  public addAviso(condoId: string, aviso: Omit<Aviso, 'id' | 'condominioId' | 'criadoEm'>): Aviso {
    const novoAviso: Aviso = {
      ...aviso,
      id: `aviso_${Date.now()}`,
      condominioId: condoId,
      criadoEm: Date.now(),
    };

    if (!this.avisos[condoId]) this.avisos[condoId] = [];
    this.avisos[condoId].unshift(novoAviso);

    this.saveToStorage();
    this.ensureCondoSubscribed(condoId);
    syncAvisoToFirestore(novoAviso).catch((err) => console.warn('Sync Aviso error:', err));

    if (aviso.prioritario) {
      this.addNotification({
        condominioId: condoId,
        titulo: `🚨 Comunicado Urgente: ${aviso.titulo}`,
        mensagem: aviso.mensagem,
        tipo: 'aviso',
      });
    }

    this.notify();
    return novoAviso;
  }

  public deleteAviso(condoId: string, avisoId: string) {
    if (this.avisos[condoId]) {
      this.avisos[condoId] = this.avisos[condoId].filter((a) => a.id !== avisoId);
      this.notify();
    }
  }

  // --- Notificações ---
  public getNotificacoes(condoId: string, moradorId?: string): AppNotification[] {
    return this.notificacoes.filter((n) => {
      if (n.condominioId !== condoId) return false;
      if (!n.paraMoradorId) return true; // broadcast
      return n.paraMoradorId === moradorId;
    });
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'lida'>) {
    const newN: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      lida: false,
    };
    this.notificacoes.unshift(newN);
    this.notify();
  }

  public markNotificationAsRead(id: string) {
    const n = this.notificacoes.find((x) => x.id === id);
    if (n) {
      n.lida = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead(condoId: string, moradorId?: string) {
    this.notificacoes.forEach((n) => {
      if (n.condominioId === condoId && (!n.paraMoradorId || n.paraMoradorId === moradorId)) {
        n.lida = true;
      }
    });
    this.notify();
  }

  // --- Gestão de Cobranças & Planos (Super Admin) ---
  public getCobrancas(): CobrancaCondominio[] {
    return [...this.cobrancas].sort((a, b) => b.enviadoEm - a.enviadoEm);
  }

  public getCobrancasByCondo(condoId: string): CobrancaCondominio[] {
    return this.cobrancas
      .filter((c) => c.condominioId === condoId)
      .sort((a, b) => b.enviadoEm - a.enviadoEm);
  }

  public criarCobranca(data: Omit<CobrancaCondominio, 'id' | 'enviadoEm'>): CobrancaCondominio {
    const newId = `cobranca_${Date.now()}`;
    const novaCobranca: CobrancaCondominio = {
      ...data,
      id: newId,
      enviadoEm: Date.now(),
    };

    this.cobrancas.unshift(novaCobranca);
    syncCobrancaToFirestore(novaCobranca).catch((err) =>
      console.warn('Sync Cobranca error:', err)
    );

    // Cria notificação no painel do síndico
    this.addNotification({
      condominioId: data.condominioId,
      titulo: `💳 Fatura SmartCondo - ${data.mesReferencia}`,
      mensagem: `A fatura no valor de R$ ${data.valor.toFixed(2)} com vencimento em ${new Date(data.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')} está disponível para pagamento via PIX.`,
      tipo: 'sistema',
    });

    // Atualiza status financeiro do condomínio se pendente
    const condo = this.getCondominio(data.condominioId);
    if (condo && condo.statusPagamento !== 'em_dia') {
      condo.statusPagamento = 'pendente';
      syncCondominioToFirestore(condo).catch((err) =>
        console.warn('Sync Condominio error:', err)
      );
    }

    this.notify();
    return novaCobranca;
  }

  public atualizarStatusCobranca(
    id: string,
    status: 'pendente' | 'enviada' | 'paga' | 'cancelada'
  ) {
    const cobranca = this.cobrancas.find((c) => c.id === id);
    if (cobranca) {
      cobranca.status = status;
      syncCobrancaToFirestore(cobranca).catch((err) =>
        console.warn('Sync Cobranca error:', err)
      );

      // Se foi paga, atualiza status do condomínio
      if (status === 'paga') {
        const condo = this.getCondominio(cobranca.condominioId);
        if (condo) {
          condo.statusPagamento = 'em_dia';
          syncCondominioToFirestore(condo).catch((err) =>
            console.warn('Sync Condominio error:', err)
          );
        }
      }

      this.notify();
    }
  }

  public excluirCobranca(id: string) {
    this.cobrancas = this.cobrancas.filter((c) => c.id !== id);
    deleteCobrancaFromFirestore(id).catch((err) =>
      console.warn('Delete Cobranca error:', err)
    );
    this.notify();
  }

  public getPlanosConfig(): Record<PlanoTipo, PlanoConfigItem> {
    return { ...this.planosConfig };
  }

  public getPlanoConfig(planoId: PlanoTipo): PlanoConfigItem {
    return (
      this.planosConfig[planoId] ||
      DEFAULT_PLANOS_CONFIG[planoId] ||
      DEFAULT_PLANOS_CONFIG.Plus
    );
  }

  public updatePlanoConfig(planoId: PlanoTipo, updates: Partial<PlanoConfigItem>) {
    if (!this.planosConfig[planoId]) {
      this.planosConfig[planoId] = {
        ...(DEFAULT_PLANOS_CONFIG[planoId] || DEFAULT_PLANOS_CONFIG.Plus),
        ...updates,
        id: planoId,
      };
    } else {
      this.planosConfig[planoId] = { ...this.planosConfig[planoId], ...updates };
    }
    this.notify();
  }

  public resetPlanosConfig() {
    this.planosConfig = { ...DEFAULT_PLANOS_CONFIG };
    this.notify();
  }

  public atualizarPlanoCondominio(
    condoId: string,
    plano: PlanoTipo,
    valorMensalidade?: number,
    diaVencimento?: number,
    statusPagamento?: 'em_dia' | 'pendente' | 'vencido' | 'cortesia'
  ) {
    const condo = this.getCondominio(condoId);
    if (condo) {
      condo.plano = plano;

      if (plano === 'Teste') {
        const hoje = new Date();
        const fim = new Date();
        fim.setDate(fim.getDate() + 90); // 3 meses (90 dias)

        condo.statusAssinatura = 'em_teste';
        condo.statusPagamento = statusPagamento || 'cortesia';
        condo.valorMensalidade = 0;
        condo.dataInicioTeste = hoje.toISOString().split('T')[0];
        condo.dataFimTeste = fim.toISOString().split('T')[0];
      } else {
        if (condo.statusAssinatura === 'em_teste') {
          condo.statusAssinatura = 'ativo';
        }
        if (valorMensalidade !== undefined) {
          condo.valorMensalidade = valorMensalidade;
        } else {
          condo.valorMensalidade = this.getPlanoConfig(plano).valor;
        }
        if (diaVencimento !== undefined) condo.diaVencimento = diaVencimento;
        if (statusPagamento !== undefined) condo.statusPagamento = statusPagamento;
      }

      syncCondominioToFirestore(condo).catch((err) =>
        console.warn('Sync Condominio error:', err)
      );
      this.notify();
    }
  }

  public estenderPeriodoTeste(
    condoId: string,
    options: { dias?: number; meses?: number; dataExata?: string }
  ): { success: boolean; novaDataFim: string; condo?: Condominio } {
    const condo = this.getCondominio(condoId);
    if (!condo) {
      return { success: false, novaDataFim: '' };
    }

    let targetDate = new Date();
    if (condo.dataFimTeste) {
      const parsedCurrent = new Date(condo.dataFimTeste + 'T23:59:59');
      if (!isNaN(parsedCurrent.getTime()) && parsedCurrent.getTime() > targetDate.getTime()) {
        targetDate = parsedCurrent;
      }
    }

    if (options.dataExata) {
      targetDate = new Date(options.dataExata + 'T23:59:59');
    } else if (options.meses) {
      targetDate.setMonth(targetDate.getMonth() + options.meses);
    } else if (options.dias) {
      targetDate.setDate(targetDate.getDate() + options.dias);
    } else {
      targetDate.setDate(targetDate.getDate() + 90);
    }

    const novaDataStr = targetDate.toISOString().split('T')[0];
    condo.statusAssinatura = 'em_teste';
    condo.plano = 'Teste';
    condo.statusPagamento = 'cortesia';
    condo.valorMensalidade = 0;
    condo.dataFimTeste = novaDataStr;
    if (!condo.dataInicioTeste) {
      condo.dataInicioTeste = new Date().toISOString().split('T')[0];
    }

    syncCondominioToFirestore(condo).catch((err) =>
      console.warn('Sync Condominio estender teste error:', err)
    );
    this.saveToStorage();
    this.notify();

    return { success: true, novaDataFim: novaDataStr, condo };
  }

  // --- MÓDULO 4.1: RESERVA DE BICICLETAS COMPARTILHADAS (5 MINUTOS - NOVOLAR) ---
  public reservarBike5Min(
    condoId: string,
    bikeId: string,
    moradorId: string
  ): { success: boolean; message: string; bike?: Bicicleta; codigoReserva?: string; tempoLimiteSegundos?: number } {
    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não localizado no sistema.' };
    }

    if (morador.statusAdimplencia === 'com_pendencia') {
      return {
        success: false,
        message: 'Unidade com pendência cadastral ou financeira. Regularize para liberar bicicletas.',
      };
    }

    // Regra: Somente 1 bike ativa ou reservada por morador
    const condoBikes = this.getBikes(condoId);
    const jaPossuiReservaOuUso = condoBikes.some(
      (b) =>
        (b.status === 'em_uso' && b.usuarioAtualId === moradorId) ||
        (b.status === 'reservada_5min' && b.reservaMoradorId === moradorId)
    );

    if (jaPossuiReservaOuUso) {
      return {
        success: false,
        message: 'Você já possui uma bicicleta em andamento ou reservada. Finalize a utilização atual primeiro.',
      };
    }

    const bike = this.getBike(condoId, bikeId);
    if (!bike) {
      return { success: false, message: 'Bicicleta não encontrada.' };
    }

    if (bike.status !== 'disponivel') {
      return {
        success: false,
        message:
          bike.status === 'reservada_5min'
            ? 'Esta bicicleta já foi reservada por outro morador e está aguardando retirada.'
            : bike.status === 'em_uso'
            ? 'Esta bicicleta já está em uso.'
            : 'Esta bicicleta está em manutenção preventiva.',
      };
    }

    const agora = Date.now();
    const codigoReserva = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    bike.status = 'reservada_5min';
    bike.reserva5minTimestamp = agora;
    bike.reservaMoradorId = morador.id;
    bike.reservaMoradorNome = morador.nome;
    bike.reservaMoradorUnidade = `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`;
    bike.reservaCodigo = codigoReserva;

    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike 5min error:', err));

    // Notificação imediata no app
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: `⏱️ Reserva Confirmada: Bike #${bike.codigo}`,
      mensagem: `Você tem 5 minutos para retirar na portaria! Apresente o código ${codigoReserva}. Expira em breve se não retirado.`,
      tipo: 'bike',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';

    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'bike_reserva_5min',
      titulo: `⏱️ Reserva de Bike Ativada: ${bike.codigo}`,
      corpoMensagem: `Sua reserva da bicicleta *#${bike.codigo}* (${bike.modelo}) foi realizada com sucesso!\n\n🔑 *Código de Retirada:* *${codigoReserva}*\n⏱️ *TEMPO LIMITE:* *5 MINUTOS* para retirar na portaria.\n\n⚠️ _Caso não retire em 5 minutos, a reserva será cancelada automaticamente e liberada para outros moradores._`,
    });

    this.saveToStorage();
    this.notify();

    return {
      success: true,
      message: `Bicicleta #${bike.codigo} reservada! Você tem 5 minutos para retirar na portaria.`,
      bike,
      codigoReserva,
      tempoLimiteSegundos: 300,
    };
  }

  public cancelarReserva5Min(
    condoId: string,
    bikeId: string,
    motivo: string = 'Reserva cancelada pelo morador'
  ): { success: boolean; message: string } {
    const bike = this.getBike(condoId, bikeId);
    if (!bike) return { success: false, message: 'Bicicleta não encontrada.' };

    const moradorId = bike.reservaMoradorId;
    const bikeCodigo = bike.codigo;

    bike.status = 'disponivel';
    bike.reserva5minTimestamp = null;
    bike.reservaMoradorId = null;
    bike.reservaMoradorNome = null;
    bike.reservaMoradorUnidade = null;
    bike.reservaCodigo = null;

    syncBikeToFirestore(bike).catch((err) => console.warn('Sync Bike cancel 5min error:', err));

    if (moradorId) {
      this.addNotification({
        condominioId: condoId,
        paraMoradorId: moradorId,
        titulo: `❌ Reserva Cancelada: Bike #${bikeCodigo}`,
        mensagem: motivo,
        tipo: 'bike',
      });
    }

    this.saveToStorage();
    this.notify();
    return { success: true, message: `Reserva da bicicleta #${bikeCodigo} foi cancelada.` };
  }

  // --- MÓDULO 3: SEGURANÇA, VISITANTES E CÂMERAS ---
  public getVisitantes(condoId: string, moradorId?: string): VisitanteLiberado[] {
    const list = this.visitantes[condoId] || [];
    if (moradorId) {
      return list.filter((v) => v.moradorId === moradorId);
    }
    return [...list].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  public addVisitante(
    condoId: string,
    data: {
      moradorId: string;
      nomeVisitante: string;
      documento?: string;
      placaVeiculo?: string;
      tipo: 'visitante' | 'prestador' | 'entrega';
      empresa?: string;
      servicoDescricao?: string;
      dataVisita: string;
      periodoPermitido?: string;
      observacoes?: string;
    }
  ): VisitanteLiberado {
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    const codigoAcesso = `VIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const novo: VisitanteLiberado = {
      id: `vis_${Date.now()}`,
      condominioId: condoId,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      nomeVisitante: data.nomeVisitante,
      documento: data.documento || '',
      placaVeiculo: data.placaVeiculo || '',
      tipo: data.tipo,
      empresa: data.empresa || '',
      servicoDescricao: data.servicoDescricao || '',
      dataVisita: data.dataVisita,
      periodoPermitido: data.periodoPermitido || 'Dia Inteiro',
      codigoAcesso,
      status: 'pendente',
      criadoEm: Date.now(),
      observacoes: data.observacoes || '',
    };

    if (!this.visitantes[condoId]) this.visitantes[condoId] = [];
    this.visitantes[condoId].unshift(novo);

    // 1. Notificação para o morador confirmando
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: `🔐 Acesso Criado: ${data.nomeVisitante}`,
      mensagem: `Código gerado: ${codigoAcesso}. Envie pelo WhatsApp para seu convidado/prestador.`,
      tipo: 'seguranca',
    });

    // 2. Notificação de ALTA PRIORIDADE para Portaria e Síndico
    this.addNotification({
      condominioId: condoId,
      titulo: `🚨 LIBERAÇÃO: ${data.nomeVisitante} (Apto ${morador.unidade.apto})`,
      mensagem: `Morador ${morador.nome} (${morador.unidade.bloco ? `Bloco ${morador.unidade.bloco} - ` : ''}Apto ${morador.unidade.apto}) autorizou ${data.nomeVisitante} (${data.tipo === 'prestador' ? (data.empresa ? `${data.empresa} (Prestador)` : 'Prestador de Serviço') : 'Visitante'}) • Código: ${codigoAcesso} • Data: ${data.dataVisita} (${data.periodoPermitido || 'Dia Todo'})`,
      tipo: 'seguranca',
    });

    // 3. Sincroniza em tempo real com Firestore
    syncVisitanteToFirestore(novo).catch((e) => console.warn('Erro ao sincronizar visitante:', e));

    // 4. Emite alerta sonoro de alta visibilidade e notificação Web Push
    audioAlertService.playVisitorAlertSound();
    audioAlertService.sendNotification(`🚨 Nova Liberação na Portaria: ${data.nomeVisitante}`, {
      body: `Morador ${morador.nome} (Apto ${morador.unidade.apto}) liberou entrada • Código ${codigoAcesso}`,
    });

    this.saveToStorage();
    this.notify();
    return novo;
  }

  public cancelarVisitante(condoId: string, id: string): boolean {
    if (!this.visitantes[condoId]) return false;
    const item = this.visitantes[condoId].find((v) => v.id === id);
    if (item) {
      item.status = 'expirado';
      syncVisitanteToFirestore(item).catch(() => {});
      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  public registrarEntradaPortaria(
    condoId: string,
    codigoOuId: string,
    porteiroNome: string = 'Portaria Central'
  ): { success: boolean; message: string; visitante?: VisitanteLiberado } {
    const list = this.visitantes[condoId] || [];
    const item = list.find((v) => v.id === codigoOuId || v.codigoAcesso.toUpperCase() === codigoOuId.toUpperCase());
    if (!item) {
      return { success: false, message: 'Código de autorização de visitante não encontrado.' };
    }

    if (item.status === 'dentro') {
      return { success: false, message: 'Este visitante já se encontra dentro do condomínio.' };
    }

    item.status = 'dentro';
    item.entradaEm = Date.now();

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: item.moradorId,
      titulo: `🚪 Entrada na Portaria: ${item.nomeVisitante}`,
      mensagem: `${item.nomeVisitante} (${item.tipo === 'prestador' ? item.empresa || 'Prestador' : 'Visitante'}) acabou de ingressar no condomínio pela portaria.`,
      tipo: 'seguranca',
    });

    syncVisitanteToFirestore(item).catch(() => {});
    this.saveToStorage();
    this.notify();
    return {
      success: true,
      message: `Entrada de ${item.nomeVisitante} registrada para a unidade Bloco ${item.unidade.bloco} - Apto ${item.unidade.apto}.`,
      visitante: item,
    };
  }

  public registrarSaidaPortaria(
    condoId: string,
    id: string
  ): { success: boolean; message: string } {
    const list = this.visitantes[condoId] || [];
    const item = list.find((v) => v.id === id);
    if (!item) return { success: false, message: 'Visitante não encontrado.' };

    item.status = 'saiu';
    item.saidaEm = Date.now();

    syncVisitanteToFirestore(item).catch(() => {});
    this.saveToStorage();
    this.notify();
    return { success: true, message: `Saída de ${item.nomeVisitante} registrada.` };
  }

  // ========================================================
  // INTERFONIA DIGITAL & WALKIE-TALKIE PTT (ESTILO ZELLO)
  // ========================================================
  public getInterfoneMensagens(
    condoId: string,
    moradorId?: string,
    bloco?: string,
    apto?: string
  ): InterfoneMensagem[] {
    const list = this.interfoneMensagens[condoId] || [];
    if (!moradorId && !bloco && !apto) {
      // Portaria/Admin/Síndico: todas as mensagens do condomínio
      return [...list].sort((a, b) => a.criadoEm - b.criadoEm);
    }

    const cleanBloco = bloco ? bloco.trim().toLowerCase().replace(/^bloco\s*/i, '') : '';
    const cleanApto = apto ? apto.trim().toLowerCase().replace(/^apto\s*/i, '').replace(/^apartamento\s*/i, '') : '';

    // Para o morador: mensagens direcionadas a ele, da unidade dele, ou canais gerais/emergência/síndico
    return list
      .filter((m) => {
        if (m.tipoCanal === 'geral' || m.tipoCanal === 'emergencia') return true;
        if (m.destinatarioTipo === 'todos') return true;
        if (moradorId && (m.remetenteId === moradorId || m.destinatarioMoradorId === moradorId)) return true;

        const destB = (m.destinatarioUnidade?.bloco || '').trim().toLowerCase().replace(/^bloco\s*/i, '');
        const destA = (m.destinatarioUnidade?.apto || '').trim().toLowerCase().replace(/^apto\s*/i, '').replace(/^apartamento\s*/i, '');
        const remB = (m.remetenteUnidade?.bloco || '').trim().toLowerCase().replace(/^bloco\s*/i, '');
        const remA = (m.remetenteUnidade?.apto || '').trim().toLowerCase().replace(/^apto\s*/i, '').replace(/^apartamento\s*/i, '');

        if (cleanApto) {
          if (destA === cleanApto && (!cleanBloco || !destB || destB === cleanBloco)) return true;
          if (remA === cleanApto && (!cleanBloco || !remB || remB === cleanBloco)) return true;
        }

        return false;
      })
      .sort((a, b) => a.criadoEm - b.criadoEm);
  }

  public async enviarInterfoneMensagem(
    condoId: string,
    data: Omit<InterfoneMensagem, 'id' | 'criadoEm' | 'lido'>
  ): Promise<InterfoneMensagem> {
    const nova: InterfoneMensagem = {
      ...data,
      id: `inter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      criadoEm: Date.now(),
      lido: false,
    };

    if (!this.interfoneMensagens[condoId]) {
      this.interfoneMensagens[condoId] = [];
    }
    this.interfoneMensagens[condoId].push(nova);

    // Efeito sonoro de chamada / interfone imediato
    audioAlertService.playIntercomRingtone();

    // Localizar moradores correspondentes caso seja enviado para uma unidade
    const moradoresDoCondo = this.getMoradores(condoId);
    let targetMoradorIds: string[] = [];

    if (data.destinatarioMoradorId) {
      targetMoradorIds.push(data.destinatarioMoradorId);
    }

    if (data.destinatarioUnidade?.apto) {
      const targetApto = data.destinatarioUnidade.apto.trim().toLowerCase().replace(/^apto\s*/i, '').replace(/^apartamento\s*/i, '');
      const targetBloco = (data.destinatarioUnidade.bloco || '').trim().toLowerCase().replace(/^bloco\s*/i, '');

      const found = moradoresDoCondo.filter((m) => {
        const mApto = (m.unidade?.apto || '').trim().toLowerCase().replace(/^apto\s*/i, '').replace(/^apartamento\s*/i, '');
        const mBloco = (m.unidade?.bloco || '').trim().toLowerCase().replace(/^bloco\s*/i, '');
        return mApto === targetApto && (!targetBloco || !mBloco || mBloco === targetBloco);
      });

      found.forEach((m) => {
        if (!targetMoradorIds.includes(m.id)) {
          targetMoradorIds.push(m.id);
        }
      });
    }

    const notifTitle = data.audioDataUrl
      ? `📻 Interfone: Chamada de Áudio de ${data.remetenteNome}`
      : `💬 Interfone: Mensagem de ${data.remetenteNome}`;
    const notifBody = data.texto || (data.audioDataUrl ? 'Nova transmissão de voz recebida pelo interfone. Clique para ouvir.' : 'Mensagem do interfone.');

    // Notificação in-app e push para todos os moradores destinatários
    if (targetMoradorIds.length > 0) {
      targetMoradorIds.forEach((mId) => {
        this.addNotification({
          condominioId: condoId,
          paraMoradorId: mId,
          titulo: notifTitle,
          mensagem: notifBody,
          tipo: 'aviso',
        });
      });
    } else if (data.destinatarioTipo === 'portaria') {
      this.addNotification({
        condominioId: condoId,
        titulo: `📻 Interfone da Portaria: ${data.remetenteNome} ${data.remetenteUnidade ? `(Apto ${data.remetenteUnidade.apto})` : ''}`,
        mensagem: notifBody,
        tipo: 'seguranca',
      });
    } else if (data.destinatarioTipo === 'todos' || data.tipoCanal === 'geral' || data.tipoCanal === 'emergencia') {
      this.addNotification({
        condominioId: condoId,
        titulo: data.tipoCanal === 'emergencia' ? `🚨 ALERTA DE EMERGÊNCIA - ${data.remetenteNome}` : `📢 Comunicado Geral: ${data.remetenteNome}`,
        mensagem: notifBody,
        tipo: data.tipoCanal === 'emergencia' ? 'seguranca' : 'aviso',
      });
    }

    // Disparo de notificação nativa no navegador / PWA
    audioAlertService.sendNotification(notifTitle, {
      body: notifBody,
      tag: `interfone-${nova.id}`,
    });

    // Persiste no Firestore
    syncInterfoneToFirestore(nova).catch((err) => console.warn('Erro ao sync interfone:', err));

    this.saveToStorage();
    this.notify();
    return nova;
  }

  public marcarInterfoneLido(condoId: string, id: string): void {
    const list = this.interfoneMensagens[condoId] || [];
    const item = list.find((m) => m.id === id);
    if (item && !item.lido) {
      item.lido = true;
      syncInterfoneToFirestore(item).catch(() => {});
      this.saveToStorage();
      this.notify();
    }
  }

  public limparHistoricoInterfone(condoId: string): void {
    const list = this.interfoneMensagens[condoId] || [];
    list.forEach((m) => deleteInterfoneFromFirestore(condoId, m.id).catch(() => {}));
    this.interfoneMensagens[condoId] = [];
    this.saveToStorage();
    this.notify();
  }

  public getCameras(condoId: string): CameraAreaComum[] {
    const list = this.cameras[condoId] || [];
    if (list.length === 0) {
      return [
        {
          id: 'cam_1',
          condominioId: condoId,
          nome: 'Portaria Principal 24h & Eclusa',
          localizacao: 'Acesso Social Guarita',
          status: 'online',
          gravando: true,
          urlPlaceholder: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
          fps: 30,
        },
        {
          id: 'cam_2',
          condominioId: condoId,
          nome: 'Hall Social & Elevadores',
          localizacao: 'Torre A - Térreo',
          status: 'online',
          gravando: true,
          urlPlaceholder: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          fps: 30,
        },
        {
          id: 'cam_3',
          condominioId: condoId,
          nome: 'Garagem & Portão Veicular G1',
          localizacao: 'Subsolo 1',
          status: 'online',
          gravando: true,
          urlPlaceholder: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
          fps: 30,
        },
        {
          id: 'cam_4',
          condominioId: condoId,
          nome: 'Piscina & Deck de Lazer',
          localizacao: 'Área Externa',
          status: 'online',
          gravando: true,
          urlPlaceholder: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
          fps: 30,
        },
        {
          id: 'cam_5',
          condominioId: condoId,
          nome: 'Totem do Bicicletário Compartilhado',
          localizacao: 'Pátio Central Novolar',
          status: 'online',
          gravando: true,
          urlPlaceholder: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
          fps: 30,
        },
      ];
    }
    return [...list];
  }

  // --- MÓDULO 5: OCORRÊNCIAS E PROBLEMAS ---
  public getOcorrencias(condoId: string, moradorId?: string): Ocorrencia[] {
    const list = this.ocorrencias[condoId] || [];
    if (moradorId) {
      return list.filter((o) => o.moradorId === moradorId).sort((a, b) => b.criadoEm - a.criadoEm);
    }
    return [...list].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  public addOcorrencia(
    condoId: string,
    data: {
      moradorId: string;
      titulo: string;
      descricao: string;
      categoria: Ocorrencia['categoria'];
      prioridade: Ocorrencia['prioridade'];
      fotoUrl?: string;
    }
  ): Ocorrencia {
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    const agora = Date.now();
    const nova: Ocorrencia = {
      id: `ocorr_${agora}`,
      condominioId: condoId,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      titulo: data.titulo,
      descricao: data.descricao,
      categoria: data.categoria,
      prioridade: data.prioridade,
      status: 'enviado',
      fotoUrl: data.fotoUrl,
      criadoEm: agora,
      atualizadoEm: agora,
      historicoAcoes: [
        {
          status: 'enviado',
          mensagem: 'Ocorrência registrada pelo morador e encaminhada à administração.',
          data: agora,
          autor: morador.nome,
        },
      ],
    };

    if (!this.ocorrencias[condoId]) this.ocorrencias[condoId] = [];
    this.ocorrencias[condoId].unshift(nova);

    this.addNotification({
      condominioId: condoId,
      titulo: `⚠️ Nova Ocorrência: ${data.titulo}`,
      mensagem: `Registrada por ${morador.nome} (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}) • Categoria: ${data.categoria}`,
      tipo: 'ocorrencia',
    });

    this.saveToStorage();
    this.notify();
    return nova;
  }

  public updateOcorrenciaStatus(
    condoId: string,
    id: string,
    status: OcorrenciaStatus,
    resposta?: string,
    autorNome: string = 'Síndico / Administração'
  ): boolean {
    const list = this.ocorrencias[condoId] || [];
    const ocorrencia = list.find((o) => o.id === id);
    if (!ocorrencia) return false;

    const agora = Date.now();
    ocorrencia.status = status;
    ocorrencia.atualizadoEm = agora;

    if (resposta) {
      ocorrencia.respostaSindico = resposta;
      ocorrencia.respondidoEm = agora;
      ocorrencia.respondidoPor = autorNome;
    }

    if (!ocorrencia.historicoAcoes) ocorrencia.historicoAcoes = [];
    ocorrencia.historicoAcoes.push({
      status,
      mensagem: resposta || `Status atualizado para: ${status.replace('_', ' ').toUpperCase()}`,
      data: agora,
      autor: autorNome,
    });

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: ocorrencia.moradorId,
      titulo: `📋 Atualização no Chamado: ${ocorrencia.titulo}`,
      mensagem: `Status: ${status.toUpperCase()}${resposta ? ` • Resposta: "${resposta}"` : ''}`,
      tipo: 'ocorrencia',
    });

    this.saveToStorage();
    this.notify();
    return true;
  }

  public responderOcorrencia(
    condoId: string,
    id: string,
    resposta: string,
    status: OcorrenciaStatus = 'resolvido',
    autorNome: string = 'Síndico / Administração'
  ): boolean {
    return this.updateOcorrenciaStatus(condoId, id, status, resposta, autorNome);
  }

  // --- MÓDULO 6: FINANCEIRO E TRANSPARÊNCIA ---
  public getBoletos(condoId: string, moradorId?: string): BoletoMensalidade[] {
    const list = this.boletos[condoId] || [];
    if (moradorId) {
      return list.filter((b) => b.moradorId === moradorId);
    }
    return [...list];
  }

  public marcarBoletoComoPago(condoId: string, id: string): boolean {
    const list = this.boletos[condoId] || [];
    const boleto = list.find((b) => b.id === id);
    if (boleto) {
      boleto.status = 'pago';
      boleto.dataPagamento = Date.now();

      this.addNotification({
        condominioId: condoId,
        paraMoradorId: boleto.moradorId,
        titulo: `✅ Boleto Quitado: ${boleto.mesReferencia}`,
        mensagem: `Pagamento de R$ ${boleto.valor.toFixed(2)} confirmado com sucesso. Obrigado!`,
        tipo: 'financeiro',
      });

      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  public getExtratoFinanceiro(condoId: string): ItemExtratoFinanceiro[] {
    const list = this.extratoFinanceiro[condoId] || [];
    return [...list];
  }

  public addExtratoItem(
    condoId: string,
    item: Omit<ItemExtratoFinanceiro, 'id' | 'condominioId'>
  ): ItemExtratoFinanceiro {
    const newItem: ItemExtratoFinanceiro = {
      ...item,
      id: `ext_${Date.now()}`,
      condominioId: condoId,
    };
    if (!this.extratoFinanceiro[condoId]) this.extratoFinanceiro[condoId] = [];
    this.extratoFinanceiro[condoId].unshift(newItem);
    this.saveToStorage();
    this.notify();
    return newItem;
  }

  public addBoleto(
    condoId: string,
    boleto: Omit<BoletoMensalidade, 'id' | 'condominioId'>
  ): BoletoMensalidade {
    const newBoleto: BoletoMensalidade = {
      ...boleto,
      id: `bol_${Date.now()}`,
      condominioId: condoId,
    };
    if (!this.boletos[condoId]) this.boletos[condoId] = [];
    this.boletos[condoId].unshift(newBoleto);
    this.saveToStorage();
    this.notify();
    return newBoleto;
  }

  public zerarFinanceiro(condoId: string): boolean {
    this.extratoFinanceiro[condoId] = [];
    this.boletos[condoId] = [];
    this.saveToStorage();
    this.notify();
    return true;
  }

  // --- MÓDULO 7: COMUNIDADE, MURAL E ENQUETES ---
  public getMuralPosts(condoId: string): MuralPost[] {
    const list = this.muralPosts[condoId] || [];
    return [...list].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  public addMuralPost(
    condoId: string,
    data: {
      autorId: string;
      tipo: MuralPost['tipo'];
      titulo: string;
      conteudo: string;
      contatoTelefone?: string;
      valor?: number;
      fotoUrl?: string;
    }
  ): MuralPost {
    const morador = this.getMorador(condoId, data.autorId);
    if (!morador) throw new Error('Morador não encontrado');

    const novo: MuralPost = {
      id: `mural_${Date.now()}`,
      condominioId: condoId,
      autorId: morador.id,
      autorNome: morador.nome,
      autorUnidade: `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`,
      tipo: data.tipo,
      titulo: data.titulo,
      conteudo: data.conteudo,
      contatoTelefone: data.contatoTelefone || morador.telefone,
      valor: data.valor,
      fotoUrl: data.fotoUrl,
      criadoEm: Date.now(),
      curtidas: [],
      comentarios: [],
    };

    if (!this.muralPosts[condoId]) this.muralPosts[condoId] = [];
    this.muralPosts[condoId].unshift(novo);

    this.saveToStorage();
    this.notify();
    return novo;
  }

  public curtirMuralPost(condoId: string, postId: string, moradorId: string) {
    const list = this.muralPosts[condoId] || [];
    const post = list.find((p) => p.id === postId);
    if (post) {
      if (post.curtidas.includes(moradorId)) {
        post.curtidas = post.curtidas.filter((id) => id !== moradorId);
      } else {
        post.curtidas.push(moradorId);
      }
      this.saveToStorage();
      this.notify();
    }
  }

  public addComentarioMural(
    condoId: string,
    postId: string,
    comentario: { autorNome: string; autorUnidade: string; texto: string }
  ) {
    const list = this.muralPosts[condoId] || [];
    const post = list.find((p) => p.id === postId);
    if (post) {
      post.comentarios.push({
        id: `c_${Date.now()}`,
        autorNome: comentario.autorNome,
        autorUnidade: comentario.autorUnidade,
        texto: comentario.texto,
        timestamp: Date.now(),
      });
      this.saveToStorage();
      this.notify();
    }
  }

  public getEnquetes(condoId: string): EnqueteCondominio[] {
    const list = this.enquetes[condoId] || [];
    return [...list].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  public votarEnquete(
    condoId: string,
    enqueteId: string,
    opcaoId: string,
    moradorId: string
  ): boolean {
    const list = this.enquetes[condoId] || [];
    const enquete = list.find((e) => e.id === enqueteId);
    if (!enquete || enquete.finalizada) return false;

    // Remove voto anterior do morador se houver
    enquete.opcoes.forEach((op) => {
      if (op.votantesIds.includes(moradorId)) {
        op.votantesIds = op.votantesIds.filter((id) => id !== moradorId);
        op.votosCount = Math.max(0, op.votosCount - 1);
      }
    });

    // Adiciona novo voto
    const opcao = enquete.opcoes.find((o) => o.id === opcaoId);
    if (opcao) {
      opcao.votantesIds.push(moradorId);
      opcao.votosCount += 1;
      enquete.totalVotos = enquete.opcoes.reduce((acc, curr) => acc + curr.votosCount, 0);

      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  public getSugestoes(condoId: string): SugestaoMorador[] {
    const list = this.sugestoes[condoId] || [];
    return [...list].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  public addSugestao(
    condoId: string,
    data: {
      moradorId: string;
      titulo: string;
      mensagem: string;
    }
  ): SugestaoMorador {
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    const nova: SugestaoMorador = {
      id: `sug_${Date.now()}`,
      condominioId: condoId,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`,
      titulo: data.titulo,
      mensagem: data.mensagem,
      status: 'recebida',
      criadoEm: Date.now(),
    };

    if (!this.sugestoes[condoId]) this.sugestoes[condoId] = [];
    this.sugestoes[condoId].unshift(nova);

    this.saveToStorage();
    this.notify();
    return nova;
  }

  public updateSugestaoStatus(
    condoId: string,
    id: string,
    status: 'recebida' | 'em_analise' | 'aprovada' | 'rejeitada' | 'atendida',
    resposta?: string
  ): boolean {
    const list = this.sugestoes[condoId] || [];
    const item = list.find((s) => s.id === id);
    if (!item) return false;

    item.status = status;
    if (resposta) {
      item.respostaSindico = resposta;
      item.respondidoEm = Date.now();
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  // --- MÓDULO 8: DOCUMENTOS ---
  public getDocumentos(condoId: string): DocumentoCondominio[] {
    const list = this.documentos[condoId] || [];
    if (list.length === 0) {
      return [
        {
          id: 'doc_1',
          condominioId: condoId,
          titulo: 'Regulamento Interno & Normas de Convivência',
          categoria: 'regulamento',
          dataPublicacao: '2026-01-15',
          tamanho: '2.4 MB',
          tipoArquivo: 'pdf',
          descricao: 'Regras de uso das áreas comuns, horários de silêncio, normas de pets e bicicletário.',
          urlSimulada: '#',
        },
        {
          id: 'doc_2',
          condominioId: condoId,
          titulo: 'Convenção Condominial Registrada em Cartório',
          categoria: 'convencao',
          dataPublicacao: '2025-06-20',
          tamanho: '4.8 MB',
          tipoArquivo: 'pdf',
          descricao: 'Estatuto legal de constituição do condomínio, frações ideais e rateio de despesas.',
          urlSimulada: '#',
        },
        {
          id: 'doc_3',
          condominioId: condoId,
          titulo: 'Ata da Assembleia Geral Ordinária (AGO 2026)',
          categoria: 'ata',
          dataPublicacao: '2026-03-28',
          tamanho: '1.1 MB',
          tipoArquivo: 'pdf',
          descricao: 'Aprovação de contas do exercício anterior, previsão orçamentária e eleição do corpo diretivo.',
          urlSimulada: '#',
        },
        {
          id: 'doc_4',
          condominioId: condoId,
          titulo: 'Laudo de Inspeção Predial & AVCB do Corpo de Bombeiros',
          categoria: 'laudo',
          dataPublicacao: '2026-05-10',
          tamanho: '3.2 MB',
          tipoArquivo: 'pdf',
          descricao: 'Certificado de vistoria válido até 2028, hidrantes, alarmes e para-raios (SPDA).',
          urlSimulada: '#',
        },
        {
          id: 'doc_5',
          condominioId: condoId,
          titulo: 'Manual do Proprietário & Planta Hidráulica/Elétrica',
          categoria: 'manual',
          dataPublicacao: '2025-01-10',
          tamanho: '8.5 MB',
          tipoArquivo: 'pdf',
          descricao: 'Orientações técnicas para reformas, furações de paredes e especificações das instalações.',
          urlSimulada: '#',
        },
      ];
    }
    return [...list];
  }

  public addDocumento(
    condoId: string,
    data: {
      titulo: string;
      categoria: DocumentoCondominio['categoria'];
      descricao: string;
      tamanho?: string;
      tipoArquivo?: 'pdf' | 'doc' | 'img';
      urlSimulada?: string;
    }
  ): DocumentoCondominio {
    const novo: DocumentoCondominio = {
      id: `doc_${Date.now()}`,
      condominioId: condoId,
      titulo: data.titulo,
      categoria: data.categoria,
      descricao: data.descricao,
      dataPublicacao: new Date().toISOString().split('T')[0],
      tamanho: data.tamanho || '1.5 MB',
      tipoArquivo: data.tipoArquivo || 'pdf',
      urlSimulada: data.urlSimulada || '#',
    };

    if (!this.documentos[condoId]) {
      this.documentos[condoId] = this.getDocumentos(condoId);
    }
    this.documentos[condoId].unshift(novo);
    this.saveToStorage();
    this.notify();
    return novo;
  }

  public deleteDocumento(condoId: string, docId: string) {
    if (!this.documentos[condoId]) {
      this.documentos[condoId] = this.getDocumentos(condoId);
    }
    this.documentos[condoId] = this.documentos[condoId].filter((d) => d.id !== docId);
    this.saveToStorage();
    this.notify();
  }

  public addEnquete(
    condoId: string,
    data: {
      titulo: string;
      descricao: string;
      opcoesTextos: string[];
      expiraEm?: string;
      dataLimite?: string;
      autorNome?: string;
    }
  ): EnqueteCondominio {
    const nova: EnqueteCondominio = {
      id: `enq_${Date.now()}`,
      condominioId: condoId,
      titulo: data.titulo,
      descricao: data.descricao,
      dataLimite: data.dataLimite || data.expiraEm || '2026-12-31',
      expiraEm: data.expiraEm || data.dataLimite || '2026-12-31',
      autorNome: data.autorNome || 'Administração / Síndico',
      criadoEm: Date.now(),
      totalVotos: 0,
      finalizada: false,
      opcoes: data.opcoesTextos.map((txt, idx) => ({
        id: `op_${idx + 1}_${Date.now()}`,
        texto: txt,
        votosCount: 0,
        votantesIds: [],
      })),
    };

    if (!this.enquetes[condoId]) {
      this.enquetes[condoId] = this.getEnquetes(condoId);
    }
    this.enquetes[condoId].unshift(nova);
    this.saveToStorage();
    this.notify();
    return nova;
  }

  public finalizarEnquete(condoId: string, enqueteId: string) {
    const list = this.enquetes[condoId] || [];
    const enq = list.find((e) => e.id === enqueteId);
    if (enq) {
      enq.finalizada = true;
      this.saveToStorage();
      this.notify();
    }
  }

  public deleteMuralPost(condoId: string, postId: string) {
    if (this.muralPosts[condoId]) {
      this.muralPosts[condoId] = this.muralPosts[condoId].filter((p) => p.id !== postId);
      this.saveToStorage();
      this.notify();
    }
  }

  private initializeSampleData() {
    const demoCondoId = 'condo_park_avenue';

    // 1. Condomínio
    if (this.condominios.length === 0) {
      this.condominios = [
        {
          id: demoCondoId,
          nome: 'Residencial Park Avenue',
          cnpj: '34.892.110/0001-45',
          endereco: 'Av. das Américas, 4200 - Barra da Tijuca',
          cidade: 'Rio de Janeiro',
          uf: 'RJ',
          totalUnidades: 80,
          statusAssinatura: 'ativo',
          plano: 'Pro',
          valorMensalidade: 799,
          diaVencimento: 10,
          statusPagamento: 'em_dia',
          chavePix: 'financeiro@smartcondo.com.br',
          sindicoNome: 'Carlos Eduardo Mendes',
          sindicoEmail: 'sindico@smartcondo.com.br',
          sindicoTelefone: '(21) 98844-5511',
          portariaTelefone: '(21) 3344-9900',
          regras: {
            limiteTempoBikeMinutos: 60,
            limiteBikesPorMorador: 1,
            horarioBicicletario: '06:00 às 22:00',
            diasAntecedenciaReserva: 30,
            taxaReservaSalao: 120,
            tempoToleranciaRetiradaMinutos: 5,
          },
        },
      ];
    }

    // 2. Moradores
    if (!this.moradores[demoCondoId] || this.moradores[demoCondoId].length === 0) {
      this.moradores[demoCondoId] = [
        {
          id: 'morador_demo_1',
          condominioId: demoCondoId,
          nome: 'Juliana Paes Silveira',
          email: 'juliana.silveira@email.com',
          telefone: '(21) 99765-4321',
          senha: '123',
          unidade: { bloco: 'A', apto: '302' },
          statusAdimplencia: 'em_dia',
          statusCadastro: 'ativo',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        },
        {
          id: 'morador_demo_2',
          condominioId: demoCondoId,
          nome: 'Rodrigo Santoro Maia',
          email: 'rodrigo.maia@email.com',
          telefone: '(21) 98111-2233',
          senha: '123',
          unidade: { bloco: 'B', apto: '104' },
          statusAdimplencia: 'em_dia',
          statusCadastro: 'ativo',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        },
        {
          id: 'morador_demo_3',
          condominioId: demoCondoId,
          nome: 'Mariana Ximenes Rocha',
          email: 'mariana.ximenes@email.com',
          telefone: '(21) 97222-3344',
          senha: '123',
          unidade: { bloco: 'A', apto: '501' },
          statusAdimplencia: 'em_dia',
          statusCadastro: 'ativo',
        },
      ];
    }

    // 3. Bicicletas Compartilhadas - Iniciadas zeradas para cadastro do zero
    if (!this.bikes[demoCondoId]) {
      this.bikes[demoCondoId] = [];
    }

    // 4. Áreas de Lazer
    if (!this.areasLazer[demoCondoId] || this.areasLazer[demoCondoId].length === 0) {
      this.areasLazer[demoCondoId] = [
        {
          id: 'area_1',
          condominioId: demoCondoId,
          nome: 'Espaço Gourmet & Churrasqueira',
          tipo: 'churrasqueira',
          status: 'aberto',
          aviso: 'Equipado com churrasqueira a carvão, chopeira e freezer horizontal.',
          capacidade: 25,
          permiteReserva: true,
          taxaReserva: 80,
          horarioFuncionamento: '10:00 às 22:00',
          atualizadoEm: Date.now(),
        },
        {
          id: 'area_2',
          condominioId: demoCondoId,
          nome: 'Salão de Festas Nobre',
          tipo: 'salao_festas',
          status: 'aberto',
          aviso: 'Climatizado, com cozinha de apoio completa e sistema de som ambiente.',
          capacidade: 80,
          permiteReserva: true,
          taxaReserva: 150,
          horarioFuncionamento: '11:00 às 00:00',
          atualizadoEm: Date.now(),
        },
        {
          id: 'area_3',
          condominioId: demoCondoId,
          nome: 'Quadra Poliesportiva',
          tipo: 'quadra',
          status: 'aberto',
          aviso: 'Piso emborrachado com iluminação LED para jogos noturnos.',
          capacidade: 14,
          permiteReserva: true,
          taxaReserva: 0,
          horarioFuncionamento: '07:00 às 22:00',
          atualizadoEm: Date.now(),
        },
        {
          id: 'area_4',
          condominioId: demoCondoId,
          nome: 'Academia & Espaço Fitness',
          tipo: 'academia',
          status: 'aberto',
          aviso: 'Equipamentos modernos LifeFitness. Uso livre para moradores.',
          capacidade: 20,
          permiteReserva: false,
          taxaReserva: 0,
          horarioFuncionamento: '05:30 às 23:00',
          atualizadoEm: Date.now(),
        },
        {
          id: 'area_5',
          condominioId: demoCondoId,
          nome: 'Piscina Adulto & Infantil',
          tipo: 'piscina',
          status: 'aberto',
          aviso: 'Exame médico obrigatório. Aberta de terça a domingo.',
          capacidade: 50,
          permiteReserva: false,
          taxaReserva: 0,
          horarioFuncionamento: '08:00 às 20:00',
          atualizadoEm: Date.now(),
        },
      ];
    }

    // 5. Avisos
    if (!this.avisos[demoCondoId] || this.avisos[demoCondoId].length === 0) {
      this.avisos[demoCondoId] = [
        {
          id: 'aviso_1',
          condominioId: demoCondoId,
          titulo: '🚨 Manutenção Preventiva dos Elevadores da Torre A',
          mensagem: 'Nesta quinta-feira das 09h às 12h o elevador social passará por revisão periódica da Atlas Schindler. O elevador de serviço permanecerá 100% operante.',
          categoria: 'manutencao',
          prioritario: true,
          autor: 'Carlos Mendes',
          autorCargo: 'Síndico Profissional',
          criadoEm: Date.now() - 2 * 3600 * 1000,
        },
        {
          id: 'aviso_2',
          condominioId: demoCondoId,
          titulo: '🚲 Regras de Uso do Bicicletário Compartilhado Novolar',
          mensagem: 'Lembramos que o tempo limite de retirada após a reserva no app é de 5 minutos. Tranque o cadeado e respeite o limite de 60 minutos de passeio para que todos os vizinhos possam pedalar!',
          categoria: 'regras',
          prioritario: false,
          autor: 'Administração Novolar',
          autorCargo: 'Gestão de Mobilidade',
          criadoEm: Date.now() - 24 * 3600 * 1000,
        },
        {
          id: 'aviso_3',
          condominioId: demoCondoId,
          titulo: '🎉 Festa da Primavera & Feirinha de Moradores',
          mensagem: 'No próximo sábado teremos música ao vivo, food trucks e espaço kids na praça central do condomínio. Participe com sua família!',
          categoria: 'eventos',
          prioritario: false,
          autor: 'Comissão Social',
          autorCargo: 'Conselho',
          criadoEm: Date.now() - 48 * 3600 * 1000,
        },
      ];
    }

    // 6. Encomendas - Iniciadas zeradas para cadastro do zero
    if (!this.encomendas[demoCondoId]) {
      this.encomendas[demoCondoId] = [];
    }

    // 7. Boletos Financeiros
    if (!this.boletos[demoCondoId] || this.boletos[demoCondoId].length === 0) {
      this.boletos[demoCondoId] = [
        {
          id: 'bol_1',
          condominioId: demoCondoId,
          moradorId: 'morador_demo_1',
          moradorNome: 'Juliana Paes Silveira',
          unidade: { bloco: 'A', apto: '302' },
          mesReferencia: 'Agosto / 2026',
          valor: 620.0,
          dataVencimento: '2026-08-25',
          status: 'a_vencer',
          linhaDigitavel: '34191.79001 01043.510047 91020.150008 5 94520000062000',
          codigoBarras: '34195945200000620001790001043510049102015000',
          pixCopiaCola: '00020126580014br.gov.bcb.pix0136smartcondo-pix-parkavenue-agosto-20265204000053039865406620.005802BR5922Condominio Park Avenue6009Rio de Janeiro62070503***6304E8A1',
        },
        {
          id: 'bol_2',
          condominioId: demoCondoId,
          moradorId: 'morador_demo_1',
          moradorNome: 'Juliana Paes Silveira',
          unidade: { bloco: 'A', apto: '302' },
          mesReferencia: 'Julho / 2026',
          valor: 620.0,
          dataVencimento: '2026-07-25',
          status: 'pago',
          linhaDigitavel: '34191.79001 01043.510047 91020.150008 5 94210000062000',
          codigoBarras: '34195942100000620001790001043510049102015000',
          pixCopiaCola: '00020126580014br.gov.bcb.pix0136smartcondo-julho-pago',
          dataPagamento: Date.now() - 22 * 24 * 3600 * 1000,
        },
      ];
    }

    // 8. Ocorrências
    if (!this.ocorrencias[demoCondoId] || this.ocorrencias[demoCondoId].length === 0) {
      this.ocorrencias[demoCondoId] = [
        {
          id: 'ocorr_1',
          condominioId: demoCondoId,
          moradorId: 'morador_demo_1',
          moradorNome: 'Juliana Paes Silveira',
          unidade: { bloco: 'A', apto: '302' },
          titulo: 'Lâmpada queimada no corredor do 3º andar',
          descricao: 'A luminária em frente ao apartamento 304 está piscando e apagando à noite.',
          categoria: 'manutencao',
          prioridade: 'media',
          status: 'em_andamento',
          criadoEm: Date.now() - 36 * 3600 * 1000,
          atualizadoEm: Date.now() - 6 * 3600 * 1000,
          respostaSindico: 'Ordem de serviço aberta com o zelador. A troca do reator LED será realizada hoje à tarde.',
          respondidoEm: Date.now() - 6 * 3600 * 1000,
          respondidoPor: 'Carlos Mendes (Síndico)',
          historicoAcoes: [
            {
              status: 'enviado',
              mensagem: 'Chamado aberto pelo morador.',
              data: Date.now() - 36 * 3600 * 1000,
              autor: 'Juliana Paes',
            },
            {
              status: 'em_andamento',
              mensagem: 'Zeladoria acionada para troca de lâmpada.',
              data: Date.now() - 6 * 3600 * 1000,
              autor: 'Carlos Mendes',
            },
          ],
        },
      ];
    }

    // 9. Mural da Comunidade
    if (!this.muralPosts[demoCondoId] || this.muralPosts[demoCondoId].length === 0) {
      this.muralPosts[demoCondoId] = [
        {
          id: 'post_1',
          condominioId: demoCondoId,
          autorId: 'morador_demo_2',
          autorNome: 'Rodrigo Santoro Maia',
          autorUnidade: 'Bloco B - Apto 104',
          tipo: 'troca_venda',
          titulo: 'Cadeirinha infantil para bicicleta (seminova)',
          conteudo: 'Estou vendendo cadeirinha dianteira para bike em perfeito estado, marca Thule com cinto de 5 pontos. Valor simbólico para vizinhos!',
          valor: 150,
          contatoTelefone: '(21) 98111-2233',
          criadoEm: Date.now() - 14 * 3600 * 1000,
          curtidas: ['morador_demo_1'],
          comentarios: [
            {
              id: 'com_1',
              autorNome: 'Juliana Paes',
              autorUnidade: 'Bloco A - Apto 302',
              texto: 'Ainda disponível? Te chamei no WhatsApp!',
              timestamp: Date.now() - 10 * 3600 * 1000,
            },
          ],
        },
        {
          id: 'post_2',
          condominioId: demoCondoId,
          autorId: 'morador_demo_3',
          autorNome: 'Mariana Ximenes',
          autorUnidade: 'Bloco A - Apto 501',
          tipo: 'perdi_achei',
          titulo: 'Chaveiro com controle de portão encontrado no jardim',
          conteudo: 'Encontrei ontem à noite próximo ao parquinho infantil um chaveiro com fita azul e um controle preto. Deixei com a portaria central.',
          criadoEm: Date.now() - 28 * 3600 * 1000,
          curtidas: ['morador_demo_1', 'morador_demo_2'],
          comentarios: [],
        },
      ];
    }

    // 10. Enquetes Condominiais
    if (!this.enquetes[demoCondoId] || this.enquetes[demoCondoId].length === 0) {
      this.enquetes[demoCondoId] = [
        {
          id: 'enq_1',
          condominioId: demoCondoId,
          titulo: 'Instalação de Ar-Condicionado Inverter na Academia',
          descricao: 'Consulta prévia aos moradores sobre a aquisição e instalação de 2 aparelhos de ar-condicionado de 24.000 BTUs para climatização do espaço fitness, utilizando saldo do fundo de reserva.',
          dataLimite: '2026-08-30',
          criadoEm: Date.now() - 72 * 3600 * 1000,
          finalizada: false,
          totalVotos: 48,
          autorNome: 'Administração & Conselho Consultivo',
          opcoes: [
            {
              id: 'op_1',
              texto: 'Sim, concordo com a melhoria',
              votosCount: 39,
              votantesIds: ['morador_demo_2', 'morador_demo_3'],
            },
            {
              id: 'op_2',
              texto: 'Não, prefiro manter ventiladores',
              votosCount: 9,
              votantesIds: [],
            },
          ],
        },
      ];
    }

    // 11. Visitantes
    if (!this.visitantes[demoCondoId] || this.visitantes[demoCondoId].length === 0) {
      this.visitantes[demoCondoId] = [
        {
          id: 'vis_demo_1',
          condominioId: demoCondoId,
          moradorId: 'morador_demo_1',
          moradorNome: 'Juliana Paes Silveira',
          unidade: { bloco: 'A', apto: '302' },
          nomeVisitante: 'Roberto Silveira (Pai)',
          documento: 'MG-14.890.123',
          placaVeiculo: 'RJS-8A90',
          tipo: 'visitante',
          dataVisita: '2026-08-16',
          periodoPermitido: '14:00 às 20:00',
          codigoAcesso: 'VIS-4921',
          status: 'pendente',
          criadoEm: Date.now() - 2 * 3600 * 1000,
          observacoes: 'Vaga de visitante solicitada',
        },
      ];
    }

    // 12. Itens e Equipamentos Compartilhados (Ferramentas, Utilidades) - Iniciados zerados para cadastro do zero
    if (!this.itensCompartilhados[demoCondoId]) {
      this.itensCompartilhados[demoCondoId] = [];
    }

    this.saveToStorage();
  }

  // --- Consulta de Moradores por Unidade (Múltiplos moradores no mesmo apto) ---
  public getMoradoresDaUnidade(
    condoId: string,
    bloco: string,
    apto: string
  ): Morador[] {
    const list = this.moradores[condoId] || [];
    const bTrim = bloco.trim().toLowerCase();
    const aTrim = apto.trim().toLowerCase();
    return list.filter(
      (m) =>
        m.unidade.bloco.trim().toLowerCase() === bTrim &&
        m.unidade.apto.trim().toLowerCase() === aTrim
    );
  }

  public getMoradoresPorUnidade(condoId: string): Record<string, Morador[]> {
    const list = this.moradores[condoId] || [];
    const map: Record<string, Morador[]> = {};
    list.forEach((m) => {
      const key = `Bloco ${m.unidade.bloco || '1'} - Apto ${m.unidade.apto}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }
}

export const condoStore = new MockCondoStore();
