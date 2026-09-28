import React from 'react';
import { LedgerEntry } from '../types';
import { formatBytes } from '../utils/names';
import { History, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface TransferLedgerProps {
  ledger: LedgerEntry[];
  onClearLedger: () => void;
}

export const TransferLedger: React.FC<TransferLedgerProps> = ({ ledger, onClearLedger }) => {
  if (ledger.length === 0) return null;

  return (
    <div className="bg-[#0D0D10]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Transfer Ledger
            </h3>
            <p className="text-xs text-zinc-400 font-medium">Session transfer audit history</p>
          </div>
        </div>

        <button
          onClick={onClearLedger}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
          title="Clear Session History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Ledger</span>
        </button>
      </div>

      <div className="divide-y divide-white/[0.06] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-zinc-500 uppercase tracking-widest font-bold text-[10px]">
              <th className="pb-2.5 font-bold">Direction</th>
              <th className="pb-2.5 font-bold">File Details</th>
              <th className="pb-2.5 font-bold hidden sm:table-cell">Peer</th>
              <th className="pb-2.5 font-bold hidden md:table-cell">Size</th>
              <th className="pb-2.5 font-bold text-right">Time & Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {ledger.map((entry) => {
              const isSent = entry.direction === 'sending';
              return (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isSent ? 'bg-white/[0.08] text-white border border-white/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isSent ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-semibold text-zinc-300 capitalize hidden sm:inline">
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 pr-3 max-w-[180px] sm:max-w-xs">
                    <p className="font-bold text-white truncate" title={entry.fileName}>
                      {entry.fileName}
                    </p>
                    <p className="text-[11px] text-zinc-400 sm:hidden">
                      {formatBytes(entry.fileSize)} • {entry.peerName}
                    </p>
                  </td>

                  <td className="py-3.5 pr-3 hidden sm:table-cell font-medium text-zinc-300">
                    {entry.peerName}
                  </td>

                  <td className="py-3.5 pr-3 hidden md:table-cell font-mono text-zinc-400">
                    {formatBytes(entry.fileSize)}
                  </td>

                  <td className="py-3.5 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-[11px] text-zinc-500">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                          entry.status === 'completed'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {entry.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span className="capitalize">{entry.status}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
