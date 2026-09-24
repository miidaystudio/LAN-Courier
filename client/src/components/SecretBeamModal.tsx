import React, { useState } from 'react';
import { SecretNote, Peer } from '../types';
import { Lock, Unlock, Key, Copy, Check, ShieldAlert, Sparkles } from 'lucide-react';

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
  
  // Decrypt inputs keyed by noteId
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

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all hover:scale-105"
      >
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        <span>E2EE Secret Beam</span>
        {secretNotes.filter((n) => n.status === 'locked').length > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>

      {/* Secret Beam Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    End-to-End Encrypted Vault
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Browser-native AES-256-GCM. Zero server decryptability.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 text-sm font-mono transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Compose Encrypted Note */}
            <form onSubmit={handleSend} className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Secret Note / Password Payload
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Type passwords, recovery seeds, API keys, or confidential notes..."
                  className="w-full p-3 rounded-2xl text-sm bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Encryption Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Shared secret password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Target Recipient
                  </label>
                  <select
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl text-sm bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">Broadcast to Room (Encrypted)</option>
                    {peers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.deviceName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!noteText.trim() || !passphrase.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Encrypt & Beam Payload</span>
              </button>
            </form>

            {/* Received Encrypted Vault Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Received Secret Payloads ({secretNotes.length})
              </h4>

              {secretNotes.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">
                  No encrypted notes received yet
                </div>
              ) : (
                secretNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {note.status === 'decrypted' ? (
                          <Unlock className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="text-xs font-bold text-zinc-900">
                          From: {note.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(note.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {note.status === 'decrypted' ? (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-start justify-between gap-2">
                        <p className="text-sm font-mono text-zinc-800 break-all select-all">
                          {note.decryptedText}
                        </p>
                        <button
                          onClick={() => handleCopy(note.id, note.decryptedText || '')}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs transition-colors"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                            placeholder="Enter passphrase to decrypt"
                            value={decryptPassphrases[note.id] || ''}
                            onChange={(e) =>
                              setDecryptPassphrases((prev) => ({
                                ...prev,
                                [note.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleDecrypt(note.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                          >
                            Decrypt
                          </button>
                        </div>
                        {note.status === 'failed' && (
                          <p className="text-[11px] text-red-600 flex items-center gap-1">
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
