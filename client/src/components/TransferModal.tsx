import React from 'react';
import { ConsentRequest } from '../types';
import { formatBytes } from '../utils/names';
import { FileText, Folder, ShieldCheck, X, Check } from 'lucide-react';

interface TransferModalProps {
  request: ConsentRequest | null;
  onAccept: (transferId: string) => void;
  onDecline: (transferId: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ request, onAccept, onDecline }) => {
  if (!request) return null;

  const isBatch = (request.batchCount || 1) > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D0D10]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.8)] border border-white/[0.12] transform transition-all">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AirDrop Peer Consent</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">P2P Direct</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {isBatch ? 'Incoming Batch Transfer' : 'Incoming File Request'}
        </h3>
        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          <span className="font-bold text-white">{request.senderName}</span> wants to beam {isBatch ? `${request.batchCount} files` : 'a file'} directly to your device via local WebRTC.
        </p>

        {/* File / Folder Preview Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/50 border border-white/[0.08] shadow-inner mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white flex-shrink-0">
            {isBatch ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm truncate" title={request.metadata.name}>
              {request.metadata.name}
            </p>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {formatBytes(request.totalBatchSize || request.metadata.size)} • {isBatch ? `${request.batchCount} files` : `${request.metadata.chunkCount} slices`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDecline(request.transferId)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => onAccept(request.transferId)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Accept & Receive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
