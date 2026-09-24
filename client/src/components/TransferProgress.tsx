import React from 'react';
import { TransferState } from '../types';
import { formatBytes, formatDuration } from '../utils/names';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface TransferProgressProps {
  transfers: TransferState[];
}

export const TransferProgress: React.FC<TransferProgressProps> = ({ transfers }) => {
  if (transfers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Active & Recent Transfers
      </h3>

      <div className="grid gap-3">
        {transfers.map((tx) => (
          <div
            key={tx.id}
            className="editorial-card rounded-2xl p-4 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.direction === 'sending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {tx.direction === 'sending' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate" title={tx.fileName}>
                    {tx.fileName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {tx.direction === 'sending' ? `To: ${tx.peerName}` : `From: ${tx.peerName}`} • {formatBytes(tx.fileSize)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {tx.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                )}
                {tx.status === 'in_progress' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md animate-pulse">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{tx.speedMbps > 0 ? `${tx.speedMbps.toFixed(1)} MB/s` : 'Streaming...'}</span>
                  </span>
                )}
                {tx.status === 'pending_consent' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting Consent</span>
                  </span>
                )}
                {tx.status === 'failed' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Failed</span>
                  </span>
                )}
                {tx.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                    <span>Declined</span>
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {tx.status === 'in_progress' && (
              <div className="mt-3">
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-200"
                    style={{ width: `${tx.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-1.5">
                  <span>{formatBytes(tx.bytesTransferred)} / {formatBytes(tx.fileSize)} ({tx.progress}%)</span>
                  {tx.timeRemainingSeconds > 0 && (
                    <span>ETA: {formatDuration(tx.timeRemainingSeconds)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
