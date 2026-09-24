import { EncryptedPayload } from '../utils/crypto';

export interface Peer {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ipAddress?: string;
  ip?: string;
  subnetCidr?: string;
}

export interface SignalingMessage {
  type: 
    | 'peer-list'
    | 'join-custom-room'
    | 'offer'
    | 'answer'
    | 'candidate'
    | 'direct-message'
    | 'encrypted-secret'
    | 'consent-request'
    | 'consent-response'
    | 'ping'
    | 'pong';
  from?: string;
  to?: string;
  roomCode?: string;
  payload?: any;
}

export interface ReceivedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  downloadUrl: string;
  senderName: string;
  timestamp: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  relativePath?: string;
  size: number;
  type: string;
  chunkCount: number;
  chunkSize: number;
}

export interface TransferState {
  id: string;
  peerId: string;
  peerName: string;
  fileName: string;
  relativePath?: string;
  fileSize: number;
  fileType: string;
  direction: 'sending' | 'receiving';
  progress: number; // 0 to 100
  bytesTransferred: number;
  speedMbps: number;
  timeRemainingSeconds: number;
  status: 'pending_consent' | 'in_progress' | 'completed' | 'failed' | 'rejected' | 'cancelled';
  startTime?: number;
  error?: string;
}

export interface ConsentRequest {
  transferId: string;
  senderId: string;
  senderName: string;
  metadata: FileMetadata;
  batchCount?: number;
  totalBatchSize?: number;
}

export interface SecretNote {
  id: string;
  senderName: string;
  encrypted: EncryptedPayload;
  decryptedText?: string;
  timestamp: number;
  status: 'locked' | 'decrypted' | 'failed';
}

export interface DirectMessagePayload {
  text: string;
  senderName: string;
  timestamp: number;
}

export interface ClipboardPayload {
  text: string;
  senderName: string;
  timestamp: number;
}
