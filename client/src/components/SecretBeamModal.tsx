import React, { useState } from 'react';
import { SecretNote, Peer } from '../types';
import { Lock, Unlock, Key, Copy, Check, ShieldAlert, Sparkles, X } from 'lucide-react';

interface SecretBeamModalProps {
  peers: Peer[];
  secretNotes: SecretNote[];
  onSendSecret: (text: string, passphrase: string, targetPeerId?: string) => void;
  onDecryptSecret: (noteId: string, passphrase: string) => Promise<boolean>;
}

export function SecretBeamModal({
  peers,
  secretNotes,
  onSendSecret,
  onDecryptSecret,
}: SecretBeamModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  
  const [decryptPassphrases, setDecryptPassphrases] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !passphrase.trim()) return;
    onSendSecret(noteText, passphrase, targetPeerId || undefined);
    setNoteText('');
    setPassphrase('');
  };

  const handleDecrypt = async (noteId: string) => {
    const pw = decryptPassphrases[noteId];
    if (!pw) return;
    await onDecryptSecret(noteId, pw);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lockedCount = secretNotes.filter((n) => n.status === 'locked').length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Lock className="w-3.5 h-3.5 text-black" />
        <span>Secret Beam</span>
        {lockedCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D0D10]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_16px_48px_rgba(0,0,0,0.8)] border border-white/[0.12] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.08]">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white shadow-xs">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">
                  End-to-End Encrypted Vault
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Client-side AES-256-GCM cipher. Never decrypted or stored on any server.
                </p>
              </div>
            </div>

            {/* Compose Encrypted Note */}
            <form onSubmit={handleSend} className="space-y-4 mb-8 bg-black/50 p-5 rounded-3xl border border-white/[0.08] shadow-inner">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Private Note / Password Payload
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Paste passwords, seeds, API keys, or confidential notes..."
                  className="w-full p-3 rounded-2xl text-sm bg-black/60 border border-white/10 text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Encryption Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Passphrase to unlock"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-black/60 border border-white/10 text-white focus:outline-none focus:border-white"
                    />
                    <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Recipient Device
                  </label>
                  <select
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl text-sm bg-black/60 border border-white/10 text-white focus:outline-none focus:border-white"
                  >
                    <option value="">Broadcast to Room (Encrypted)</option>
                    {peers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.deviceName} ({p.ipAddress || p.ip || 'LAN'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!noteText.trim() || !passphrase.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Encrypt & Beam to Recipient</span>
              </button>
            </form>

            {/* Received Encrypted Vault Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Received Secret Notes ({secretNotes.length})
              </h4>

              {secretNotes.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                  No encrypted secrets received yet
                </div>
              ) : (
                secretNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-3xl border border-white/[0.08] bg-black/40 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {note.status === 'decrypted' ? (
                          <Unlock className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-xs font-bold text-white">
                          From: {note.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(note.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {note.status === 'decrypted' ? (
                      <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-start justify-between gap-2">
                        <p className="text-sm font-mono text-emerald-300 break-all select-all">
                          {note.decryptedText}
                        </p>
                        <button
                          onClick={() => handleCopy(note.id, note.decryptedText || '')}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white text-xs border border-white/10 transition-colors shadow-xs"
                          title="Copy to clipboard"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter passphrase to unlock"
                            value={decryptPassphrases[note.id] || ''}
                            onChange={(e) =>
                              setDecryptPassphrases((prev) => ({
                                ...prev,
                                [note.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-black/60 border border-white/10 text-white focus:outline-none focus:border-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleDecrypt(note.id)}
                            className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors shadow-xs"
                          >
                            Decrypt
                          </button>
                        </div>
                        {note.status === 'failed' && (
                          <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Incorrect passphrase. Decryption failed.</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
