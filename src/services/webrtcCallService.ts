// Serviço WebRTC Peer-to-Peer para Interfone Digital & Telefonia
// Conexão direta de áudio/vídeo full-duplex de baixa latência com sinalização via Firestore

import { db } from './firebase';
import { doc, setDoc, onSnapshot, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export class WebRtcCallService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private unsubscribeCallDoc: (() => void) | null = null;
  private unsubscribeCandidates: (() => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.remoteAudioElement = document.createElement('audio');
      this.remoteAudioElement.autoplay = true;
      (this.remoteAudioElement as any).playsInline = true;
      document.body.appendChild(this.remoteAudioElement);
    }
  }

  public setCallbacks(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionState?: (state: RTCPeerConnectionState) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateCallback = onConnectionState || null;
  }

  /**
   * Inicia o fluxo de microfone/áudio local
   */
  public async getLocalMediaStream(enableVideo = false): Promise<MediaStream> {
    if (this.localStream) {
      this.stopLocalMediaStream();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: enableVideo ? { width: 640, height: 480, facingMode: 'user' } : false,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Microfone não encontrado ou permissão negada, utilizando stream mudo de fallback:', err);
      // Cria stream de áudio sintético silencioso para manter a conexão WebRTC viva
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = osc.connect(ctx.createMediaStreamDestination()) as any;
      osc.start();
      this.localStream = dst.stream;
      return this.localStream!;
    }
  }

  public stopLocalMediaStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }
  }

  /**
   * Criar Oferta WebRTC (Quem está ligando)
   */
  public async createCallOffer(
    condominioId: string,
    chamadaId: string,
    enableVideo = false
  ): Promise<void> {
    this.cleanup();

    const stream = await this.getLocalMediaStream(enableVideo);
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = this.remoteStream;
      this.remoteAudioElement.play().catch(() => {});
    }

    // Adiciona tracks locais
    stream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    // Recebe tracks remotos
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.remoteAudioElement && this.remoteStream) {
        this.remoteAudioElement.srcObject = this.remoteStream;
        this.remoteAudioElement.play().catch(() => {});
      }
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc && this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.pc.connectionState);
      }
    };

    // Coleta ICE Candidates do chamador
    const offerCandidatesCol = collection(
      db,
      'condominios',
      condominioId,
      'chamadas',
      chamadaId,
      'offerCandidates'
    );

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidatesCol, event.candidate.toJSON()).catch(() => {});
      }
    };

    // Cria a oferta SDP
    const offerDescription = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: enableVideo,
    });
    await this.pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    const callDoc = doc(db, 'condominios', condominioId, 'chamadas', chamadaId);
    await setDoc(callDoc, { offer }, { merge: true });

    // Escuta a Resposta SDP (Answer) do destinatário no Firestore
    this.unsubscribeCallDoc = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!this.pc?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answerDescription).catch((err) => {
          console.warn('Erro ao definir remoteDescription (answer):', err);
        });
      }
    });

    // Escuta ICE Candidates do destinatário
    const answerCandidatesCol = collection(
      db,
      'condominios',
      condominioId,
      'chamadas',
      chamadaId,
      'answerCandidates'
    );
    this.unsubscribeCandidates = onSnapshot(answerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.pc?.addIceCandidate(candidate).catch(() => {});
        }
      });
    });
  }

  /**
   * Atender Chamada WebRTC (Quem recebe a ligação)
   */
  public async answerCall(
    condominioId: string,
    chamadaId: string,
    enableVideo = false
  ): Promise<void> {
    this.cleanup();

    const stream = await this.getLocalMediaStream(enableVideo);
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = this.remoteStream;
      this.remoteAudioElement.play().catch(() => {});
    }

    // Adiciona tracks locais
    stream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    // Recebe tracks remotos
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.remoteAudioElement && this.remoteStream) {
        this.remoteAudioElement.srcObject = this.remoteStream;
        this.remoteAudioElement.play().catch(() => {});
      }
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc && this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.pc.connectionState);
      }
    };

    // Coleta ICE Candidates do destinatário
    const answerCandidatesCol = collection(
      db,
      'condominios',
      condominioId,
      'chamadas',
      chamadaId,
      'answerCandidates'
    );
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidatesCol, event.candidate.toJSON()).catch(() => {});
      }
    };

    // Lê a oferta do chamador
    const callDoc = doc(db, 'condominios', condominioId, 'chamadas', chamadaId);
    const callSnap = await getDoc(callDoc);
    const callData = callSnap.data();

    if (!callData?.offer) {
      console.warn('Nenhuma oferta SDP encontrada no documento da chamada:', chamadaId);
      return;
    }

    const offerDescription = new RTCSessionDescription(callData.offer);
    await this.pc.setRemoteDescription(offerDescription);

    // Cria a resposta (Answer)
    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: 'em_andamento' });

    // Escuta ICE Candidates do chamador
    const offerCandidatesCol = collection(
      db,
      'condominios',
      condominioId,
      'chamadas',
      chamadaId,
      'offerCandidates'
    );
    this.unsubscribeCandidates = onSnapshot(offerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.pc?.addIceCandidate(candidate).catch(() => {});
        }
      });
    });
  }

  public setMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public cleanup() {
    if (this.unsubscribeCallDoc) {
      this.unsubscribeCallDoc();
      this.unsubscribeCallDoc = null;
    }
    if (this.unsubscribeCandidates) {
      this.unsubscribeCandidates();
      this.unsubscribeCandidates = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.stopLocalMediaStream();
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }
    this.remoteStream = null;
  }
}

export const webrtcCallService = new WebRtcCallService();
