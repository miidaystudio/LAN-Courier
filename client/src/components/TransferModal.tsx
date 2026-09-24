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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 transform transition-all">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AirDrop Peer Consent</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">P2P Direct</span>
        </div>

        <h3 className="text-xl font-bold text-zinc-900 mb-1">
          {isBatch ? 'Incoming Batch Transfer' : 'Incoming File Request'}
        </h3>
        <p className="text-sm text-zinc-600 mb-6">
          <span className="font-semibold text-zinc-900">{request.senderName}</span> wants to stream {isBatch ? `${request.batchCount} files` : 'a file'} directly to your device.
        </p>

        {/* File / Folder Preview Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            {isBatch ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900 text-sm truncate" title={request.metadata.name}>
              {request.metadata.name}
            </p>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {formatBytes(request.totalBatchSize || request.metadata.size)} • {isBatch ? `${request.batchCount} files` : `${request.metadata.chunkCount} chunks`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDecline(request.transferId)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => onAccept(request.transferId)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Receive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
