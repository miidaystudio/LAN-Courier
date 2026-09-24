import { useEffect, useRef, useState, useCallback } from 'react';
import { Peer, SignalingMessage, FileMetadata, TransferState, ConsentRequest, SecretNote, ReceivedFile } from '../types';
import { getDeviceIdentity } from '../utils/names';
import { encryptText, decryptText, EncryptedPayload } from '../utils/crypto';
import { playConnectSound, playTransferStartSound, playTransferCompleteSound, playSecretSound } from '../utils/audio';
import { FileItem } from '../utils/fileTree';

const CHUNK_SIZE = 64 * 1024; // 64 KB binary pieces
const MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024; // 8 MB backpressure limit
const LOW_BUFFERED_THRESHOLD = 2 * 1024 * 1024; // 2 MB resume threshold

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC() {
  const [self, setSelf] = useState(getDeviceIdentity());
  const [peers, setPeers] = useState<Peer[]>([]);
  const [myIP, setMyIP] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>(() => localStorage.getItem('lan_courier_room_code') || '');
  const [isCustomRoom, setIsCustomRoom] = useState<boolean>(() => !!localStorage.getItem('lan_courier_room_code'));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTransfers, setActiveTransfers] = useState<Map<string, TransferState>>(new Map());
  const [pendingConsent, setPendingConsent] = useState<ConsentRequest | null>(null);
  const [secretNotes, setSecretNotes] = useState<SecretNote[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
  
  // Receiver-side file assembling buffers: transferId -> metadata & chunks
  const receivingBuffers = useRef<Map<string, {
    metadata: FileMetadata;
    senderId: string;
    senderName: string;
    chunks: ArrayBuffer[];
    receivedBytes: number;
    startTime: number;
    lastCalcTime: number;
    lastCalcBytes: number;
  }>>(new Map());

  // Sender file queue for pending transfers
  const pendingFilesToSend = useRef<Map<string, { items: FileItem[]; targetPeerId: string; targetPeerName: string }>>(new Map());

  // 1. Establish WebSocket Signaling connection with dual-endpoint failover
  useEffect(() => {
    let reconnectTimeout: any = null;
    let isMounted = true;
    let hasPlayedConnectSound = false;

    const connectWebSocket = () => {
      if (!isMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const queryParams = new URLSearchParams({
        peerId: self.id,
        deviceName: self.name,
        deviceType: self.type,
      });
      if (roomCode) {
        queryParams.set('roomCode', roomCode);
      }

      // Try proxied /ws endpoint first, with fallback directly to port 5000 if proxy is bypassed
      const defaultWsUrl = `${protocol}//${host}/ws?${queryParams.toString()}`;
      const directWsUrl = `${protocol}//${window.location.hostname}:5000/ws?${queryParams.toString()}`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(defaultWsUrl);
      } catch {
        ws = new WebSocket(directWsUrl);
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        console.log('[Signaling] WebSocket Connected to Hub');
        setIsConnected(true);
        if (!hasPlayedConnectSound) {
          playConnectSound();
          hasPlayedConnectSound = true;
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = async (event) => {
        try {
          const env: SignalingMessage = JSON.parse(event.data);
          await handleSignalingEnvelope(env);
        } catch (err) {
          console.error('[Signaling] Parse error:', err);
        }
      };
    };

    connectWebSocket();

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (wsRef.current) wsRef.current.close();
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      dataChannels.current.clear();
    };
  }, [self.id, self.name, self.type, roomCode]);

  // Send signaling message helper
  const sendEnvelope = useCallback((env: Partial<SignalingMessage>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(env));
    }
  }, []);

  // Update transfer state helper
  const updateTransfer = useCallback((id: string, updater: (prev: TransferState) => TransferState) => {
    setActiveTransfers((prev) => {
      const next = new Map(prev);
      const current = next.get(id);
      if (current) {
        next.set(id, updater(current));
      }
      return next;
    });
  }, []);

  // 2. Handle Incoming Signaling Envelopes
  const handleSignalingEnvelope = async (env: SignalingMessage) => {
    switch (env.type) {
      case 'peer-list': {
        const payload = env.payload;
        if (payload?.roomCode) {
          setRoomCode(payload.roomCode);
        }
        if (payload?.peers) {
          const selfPeer = payload.peers.find((p: Peer) => p.id === self.id);
          if (selfPeer?.ipAddress || selfPeer?.ip) {
            setMyIP(selfPeer.ipAddress || selfPeer.ip || '');
          }
          const otherPeers = payload.peers.filter((p: Peer) => p.id !== self.id);
          setPeers(otherPeers);
        }
        break;
      }

      case 'consent-request': {
        const { transferId, metadata, senderName, batchCount, totalBatchSize } = env.payload;
        setPendingConsent({
          transferId,
          senderId: env.from!,
          senderName: senderName || 'Nearby Peer',
          metadata,
          batchCount,
          totalBatchSize,
        });
        break;
      }

      case 'consent-response': {
        const { transferId, accepted } = env.payload;
        const queued = pendingFilesToSend.current.get(transferId);
        if (!queued) return;

        if (accepted) {
          playTransferStartSound();
          updateTransfer(transferId, (t) => ({ ...t, status: 'in_progress', startTime: Date.now() }));
          await initiateBatchSend(transferId, queued.items, queued.targetPeerId);
        } else {
          updateTransfer(transferId, (t) => ({ ...t, status: 'rejected', error: 'Declined by recipient' }));
          pendingFilesToSend.current.delete(transferId);
        }
        break;
      }

      case 'offer': {
        if (!env.from) return;
        const pc = getOrCreatePeerConnection(env.from);
        await pc.setRemoteDescription(new RTCSessionDescription(env.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendEnvelope({
          type: 'answer',
          to: env.from,
          payload: answer,
        });
        break;
      }

      case 'answer': {
        if (!env.from) return;
        const pc = peerConnections.current.get(env.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(env.payload));
        }
        break;
      }

      case 'candidate': {
        if (!env.from || !env.payload) return;
        const pc = peerConnections.current.get(env.from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(env.payload));
          } catch (e) {
            console.error('[WebRTC] ICE candidate error', e);
          }
        }
        break;
      }

      case 'encrypted-secret': {
        if (env.payload?.encrypted) {
          playSecretSound();
          const newSecret: SecretNote = {
            id: env.payload.id || crypto.randomUUID(),
            senderName: env.payload.senderName || 'Peer',
            encrypted: env.payload.encrypted,
            timestamp: Date.now(),
            status: 'locked',
          };
          setSecretNotes((prev) => [newSecret, ...prev]);
        }
        break;
      }
    }
  };

  // 3. Initialize RTCPeerConnection
  const getOrCreatePeerConnection = (targetPeerId: string): RTCPeerConnection => {
    let pc = peerConnections.current.get(targetPeerId);
    if (pc && pc.signalingState !== 'closed') {
      return pc;
    }

    pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(targetPeerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendEnvelope({
          type: 'candidate',
          to: targetPeerId,
          payload: event.candidate,
        });
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannelEvents(channel, targetPeerId);
      dataChannels.current.set(targetPeerId, channel);
    };

    return pc;
  };

  // 4. Setup DataChannel listeners
  const setupDataChannelEvents = (channel: RTCDataChannel, peerId: string) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log(`[DataChannel] Open with ${peerId}`);
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const control = JSON.parse(event.data);
          handleDataChannelControl(control, peerId);
        } catch (e) {
          console.error('[DataChannel] Control parse error', e);
        }
      } else if (event.data instanceof ArrayBuffer) {
        handleIncomingChunk(event.data, peerId);
      }
    };
  };

  // 5. Handle Control Headers
  const handleDataChannelControl = (control: any, peerId: string) => {
    if (control.type === 'file-start') {
      const metadata: FileMetadata = control.metadata;
      const peer = peers.find((p) => p.id === peerId);

      playTransferStartSound();

      receivingBuffers.current.set(metadata.id, {
        metadata,
        senderId: peerId,
        senderName: peer?.deviceName || 'Peer',
        chunks: [],
        receivedBytes: 0,
        startTime: Date.now(),
        lastCalcTime: Date.now(),
        lastCalcBytes: 0,
      });

      setActiveTransfers((prev) => {
        const next = new Map(prev);
        next.set(metadata.id, {
          id: metadata.id,
          peerId,
          peerName: peer?.deviceName || 'Peer',
          fileName: metadata.name,
          relativePath: metadata.relativePath,
          fileSize: metadata.size,
          fileType: metadata.type,
          direction: 'receiving',
          progress: 0,
          bytesTransferred: 0,
          speedMbps: 0,
          timeRemainingSeconds: 0,
          status: 'in_progress',
          startTime: Date.now(),
        });
        return next;
      });
    } else if (control.type === 'file-complete') {
      finalizeReceivedFile(control.fileId);
    }
  };

  // 6. Handle Incoming 64KB Binary Chunks
  const handleIncomingChunk = (chunk: ArrayBuffer, peerId: string) => {
    for (const [transferId, buf] of receivingBuffers.current.entries()) {
      if (buf.senderId === peerId) {
        buf.chunks.push(chunk);
        buf.receivedBytes += chunk.byteLength;

        const now = Date.now();
        const totalProgress = Math.min(100, Math.round((buf.receivedBytes / buf.metadata.size) * 100));

        let speedMbps = 0;
        let timeRemaining = 0;
        if (now - buf.lastCalcTime > 400) {
          const deltaBytes = buf.receivedBytes - buf.lastCalcBytes;
          const deltaTime = (now - buf.lastCalcTime) / 1000;
          speedMbps = (deltaBytes / (1024 * 1024)) / (deltaTime || 1);
          const remainingBytes = buf.metadata.size - buf.receivedBytes;
          timeRemaining = speedMbps > 0 ? (remainingBytes / (1024 * 1024)) / speedMbps : 0;
          buf.lastCalcTime = now;
          buf.lastCalcBytes = buf.receivedBytes;
        }

        updateTransfer(transferId, (t) => ({
          ...t,
          progress: totalProgress,
          bytesTransferred: buf.receivedBytes,
          speedMbps: speedMbps || t.speedMbps,
          timeRemainingSeconds: timeRemaining || t.timeRemainingSeconds,
        }));

        if (buf.receivedBytes >= buf.metadata.size) {
          finalizeReceivedFile(transferId);
        }
        break;
      }
    }
  };

  // 7. Auto Download & Trigger Chime
  const finalizeReceivedFile = (transferId: string) => {
    const buf = receivingBuffers.current.get(transferId);
    if (!buf) return;

    playTransferCompleteSound();

    const blob = new Blob(buf.chunks, { type: buf.metadata.type || 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(blob);

    // Save in state so mobile users can tap to save/open/share
    const receivedItem: ReceivedFile = {
      id: transferId,
      name: buf.metadata.name,
      size: buf.metadata.size,
      type: buf.metadata.type || 'application/octet-stream',
      blob,
      downloadUrl,
      senderName: buf.senderName,
      timestamp: Date.now(),
    };
    setReceivedFiles((prev) => [receivedItem, ...prev]);

    // Try programmatic download (works on Desktop)
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = buf.metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('[Download] Programmatic download blocked by browser, user can tap save button.', e);
    }

    const totalDurationMs = Date.now() - buf.startTime;

    updateTransfer(transferId, (t) => ({
      ...t,
      progress: 100,
      bytesTransferred: buf.metadata.size,
      status: 'completed',
    }));

    // Post non-sensitive metrics to Neon PostgreSQL ledger
    logTransferLedger({
      roomCode,
      fileName: buf.metadata.name,
      fileSizeBytes: buf.metadata.size,
      mimeType: buf.metadata.type,
      senderDevice: buf.senderName,
      receiverDevice: self.name,
      durationMs: totalDurationMs,
      status: 'COMPLETED',
    });

    receivingBuffers.current.delete(transferId);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
  };

  // 8. Initiate File or Directory Batch Transfer
  const sendFiles = async (targetPeerId: string, items: FileItem[]) => {
    if (items.length === 0) return;

    const transferId = crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Math.random().toString(36).substring(2, 9);
    const targetPeer = peers.find((p) => p.id === targetPeerId);
    const targetPeerName = targetPeer?.deviceName || 'Peer';

    pendingFilesToSend.current.set(transferId, { items, targetPeerId, targetPeerName });

    const totalBatchSize = items.reduce((acc, curr) => acc + curr.file.size, 0);
    const firstItem = items[0];

    const metadata: FileMetadata = {
      id: transferId,
      name: items.length > 1 ? `${firstItem.file.name} (+${items.length - 1} files)` : firstItem.file.name,
      relativePath: firstItem.relativePath,
      size: totalBatchSize,
      type: firstItem.file.type || 'application/octet-stream',
      chunkCount: Math.ceil(totalBatchSize / CHUNK_SIZE),
      chunkSize: CHUNK_SIZE,
    };

    setActiveTransfers((prev) => {
      const next = new Map(prev);
      next.set(transferId, {
        id: transferId,
        peerId: targetPeerId,
        peerName: targetPeerName,
        fileName: metadata.name,
        relativePath: metadata.relativePath,
        fileSize: totalBatchSize,
        fileType: metadata.type,
        direction: 'sending',
        progress: 0,
        bytesTransferred: 0,
        speedMbps: 0,
        timeRemainingSeconds: 0,
        status: 'pending_consent',
      });
      return next;
    });

    // Request consent from receiver
    sendEnvelope({
      type: 'consent-request',
      to: targetPeerId,
      payload: {
        transferId,
        senderName: self.name,
        metadata,
        batchCount: items.length,
        totalBatchSize,
      },
    });
  };

  // 9. Backpressure-aware DataChannel Streaming
  const initiateBatchSend = async (transferId: string, items: FileItem[], targetPeerId: string) => {
    const pc = getOrCreatePeerConnection(targetPeerId);

    let channel = dataChannels.current.get(targetPeerId);
    if (!channel || channel.readyState !== 'open') {
      channel = pc.createDataChannel('file-transfer', { ordered: true });
      channel.binaryType = 'arraybuffer';
      channel.bufferedAmountLowThreshold = LOW_BUFFERED_THRESHOLD;
      setupDataChannelEvents(channel, targetPeerId);
      dataChannels.current.set(targetPeerId, channel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendEnvelope({
        type: 'offer',
        to: targetPeerId,
        payload: offer,
      });

      await new Promise<void>((resolve, reject) => {
        if (channel?.readyState === 'open') return resolve();
        const onOpen = () => {
          channel?.removeEventListener('open', onOpen);
          resolve();
        };
        channel?.addEventListener('open', onOpen);
        setTimeout(() => reject(new Error('DataChannel connection timeout')), 10000);
      });
    }

    const totalBatchSize = items.reduce((acc, curr) => acc + curr.file.size, 0);
    const firstItem = items[0];

    const metadata: FileMetadata = {
      id: transferId,
      name: items.length > 1 ? `${firstItem.file.name} (+${items.length - 1} files)` : firstItem.file.name,
      relativePath: firstItem.relativePath,
      size: totalBatchSize,
      type: firstItem.file.type || 'application/octet-stream',
      chunkCount: Math.ceil(totalBatchSize / CHUNK_SIZE),
      chunkSize: CHUNK_SIZE,
    };

    channel.send(JSON.stringify({ type: 'file-start', metadata }));

    const startTime = Date.now();
    let overallOffset = 0;
    let lastCalcTime = Date.now();
    let lastCalcOffset = 0;

    for (const item of items) {
      let fileOffset = 0;
      while (fileOffset < item.file.size) {
        // Backpressure check (8MB limit)
        if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              channel?.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            channel?.addEventListener('bufferedamountlow', onLow);
          });
        }

        const slice = item.file.slice(fileOffset, fileOffset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();
        channel.send(buffer);
        fileOffset += buffer.byteLength;
        overallOffset += buffer.byteLength;

        const now = Date.now();
        if (now - lastCalcTime > 400 || overallOffset >= totalBatchSize) {
          const deltaBytes = overallOffset - lastCalcOffset;
          const deltaTime = (now - lastCalcTime) / 1000;
          const speedMbps = (deltaBytes / (1024 * 1024)) / (deltaTime || 1);
          const remainingBytes = totalBatchSize - overallOffset;
          const timeRemaining = speedMbps > 0 ? (remainingBytes / (1024 * 1024)) / speedMbps : 0;

          lastCalcTime = now;
          lastCalcOffset = overallOffset;

          updateTransfer(transferId, (t) => ({
            ...t,
            progress: Math.min(100, Math.round((overallOffset / totalBatchSize) * 100)),
            bytesTransferred: overallOffset,
            speedMbps,
            timeRemainingSeconds: timeRemaining,
          }));
        }
      }
    }

    channel.send(JSON.stringify({ type: 'file-complete', fileId: transferId }));
    playTransferCompleteSound();

    const totalDurationMs = Date.now() - startTime;
    const targetPeer = peers.find((p) => p.id === targetPeerId);

    updateTransfer(transferId, (t) => ({
      ...t,
      progress: 100,
      bytesTransferred: totalBatchSize,
      status: 'completed',
    }));

    // Post to Neon PostgreSQL ledger
    logTransferLedger({
      roomCode,
      fileName: metadata.name,
      fileSizeBytes: totalBatchSize,
      mimeType: metadata.type,
      senderDevice: self.name,
      receiverDevice: targetPeer?.deviceName || 'Peer',
      durationMs: totalDurationMs,
      status: 'COMPLETED',
    });

    pendingFilesToSend.current.delete(transferId);
  };

  // 10. Consent Response
  const respondConsent = (transferId: string, accepted: boolean) => {
    if (!pendingConsent || pendingConsent.transferId !== transferId) return;

    sendEnvelope({
      type: 'consent-response',
      to: pendingConsent.senderId,
      payload: {
        transferId,
        accepted,
      },
    });

    setPendingConsent(null);
  };

  // 11. End-to-End Encrypted Secret Note Beam (AES-256-GCM)
  const sendSecretNote = async (text: string, passphrase: string, targetPeerId?: string) => {
    if (!text.trim() || !passphrase.trim()) return;

    const encrypted: EncryptedPayload = await encryptText(text.trim(), passphrase.trim());
    playSecretSound();

    sendEnvelope({
      type: 'encrypted-secret',
      to: targetPeerId,
      roomCode,
      payload: {
        id: crypto.randomUUID(),
        senderName: self.name,
        encrypted,
      },
    });
  };

  // 12. Decrypt Received Secret Note locally in browser
  const decryptSecretNote = async (noteId: string, passphrase: string): Promise<boolean> => {
    const note = secretNotes.find((n) => n.id === noteId);
    if (!note) return false;

    try {
      const plaintext = await decryptText(note.encrypted, passphrase);
      playSecretSound();
      setSecretNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, decryptedText: plaintext, status: 'decrypted' } : n))
      );
      return true;
    } catch {
      setSecretNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, status: 'failed' } : n))
      );
      return false;
    }
  };

  // 13. Switch or Join Manual 6-Digit PIN Room
  const joinCustomRoom = (pin: string) => {
    const cleanPin = pin.trim().toUpperCase();
    if (cleanPin) {
      localStorage.setItem('lan_courier_room_code', cleanPin);
      setRoomCode(cleanPin);
      setIsCustomRoom(true);
      sendEnvelope({
        type: 'join-custom-room',
        payload: { roomCode: cleanPin },
      });
    }
  };

  // 14. Reset to Automatic Subnet Room
  const resetToSubnetRoom = () => {
    localStorage.removeItem('lan_courier_room_code');
    setIsCustomRoom(false);
    setRoomCode('');
    // Trigger reconnection to auto-detect subnet room
    if (wsRef.current) wsRef.current.close();
  };

  // 15. Helper to log metrics to Neon Postgres
  const logTransferLedger = async (data: any) => {
    try {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('[Ledger] Transfer log push error:', e);
    }
  };

  const updateDeviceName = (newName: string) => {
    if (!newName.trim()) return;
    localStorage.setItem('lan_courier_peer_name', newName.trim());
    setSelf((prev) => ({ ...prev, name: newName.trim() }));
  };

  const dismissReceivedFile = (id: string) => {
    setReceivedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    self,
    myIP,
    peers,
    roomCode,
    isCustomRoom,
    isConnected,
    activeTransfers: Array.from(activeTransfers.values()),
    pendingConsent,
    secretNotes,
    receivedFiles,
    dismissReceivedFile,
    sendFiles,
    respondConsent,
    sendSecretNote,
    decryptSecretNote,
    joinCustomRoom,
    resetToSubnetRoom,
    updateDeviceName,
  };
}
