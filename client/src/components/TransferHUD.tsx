import React from 'react';
import { TransferState } from '../types';
import { formatBytes, formatDuration } from '../utils/names';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface TransferHUDProps {
  transfers: TransferState[];
}

export const TransferHUD: React.FC<TransferHUDProps> = ({ transfers }) => {
  if (transfers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>Active Transfers & Live Progress ({transfers.length})</span>
        </h3>
      </div>

      <div className="grid gap-3">
        {transfers.map((tx) => {
          const isSending = tx.direction === 'sending';
          const isActive = tx.status === 'in_progress';
          const isDone = tx.status === 'completed';

          return (
            <div
              key={tx.id}
              className={`rounded-3xl p-5 transition-all duration-300 bg-[#0D0D10]/90 backdrop-blur-xl border ${
                isActive
                  ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.08)] ring-1 ring-white/10'
                  : isDone
                  ? 'border-emerald-500/30'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Direction Indicator Badge */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform ${
                      isSending
                        ? 'bg-white/[0.08] text-white border border-white/20'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isSending ? (
                      <ArrowUpRight className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
                    ) : (
                      <ArrowDownLeft className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-white truncate max-w-xs sm:max-w-md" title={tx.fileName}>
                        {tx.fileName}
                      </p>
                      {tx.relativePath && tx.relativePath !== tx.fileName && (
                        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline truncate">
                          ({tx.relativePath})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                      {isSending ? `Beam to: ${tx.peerName}` : `Receiving from: ${tx.peerName}`} • {formatBytes(tx.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Status / Speed Gauge Badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      <Zap className="w-3.5 h-3.5 text-black" />
                      <span className="font-mono">
                        {tx.speedMbps > 0 ? `${tx.speedMbps.toFixed(1)} MB/s` : 'Streaming...'}
                      </span>
                    </div>
                  )}

                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </span>
                  )}

                  {tx.status === 'pending_consent' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Awaiting Consent</span>
                    </span>
                  )}

                  {tx.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Failed</span>
                    </span>
                  )}

                  {tx.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
                      <span>Declined</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar and Live HUD Metrics */}
              {isActive && (
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.08]">
                  <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                      style={{ width: `${Math.max(4, tx.progress)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{tx.progress}%</span>
                      <span>•</span>
                      <span>{formatBytes(tx.bytesTransferred)} / {formatBytes(tx.fileSize)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {tx.timeRemainingSeconds > 0 && (
                        <span className="text-zinc-400">
                          ETA: <strong className="text-white">{formatDuration(tx.timeRemainingSeconds)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
