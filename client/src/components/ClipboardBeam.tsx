import React, { useState } from 'react';
import { ClipboardPayload } from '../types';
import { Send, Copy, Check, Sparkles } from 'lucide-react';

interface ClipboardBeamProps {
  onBeam: (text: string) => void;
  recentReceived: ClipboardPayload | null;
}

export const ClipboardBeam: React.FC<ClipboardBeamProps> = ({ onBeam, recentReceived }) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onBeam(text);
    setText('');
  };

  const handleCopyRecent = () => {
    if (recentReceived?.text) {
      navigator.clipboard.writeText(recentReceived.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="editorial-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-zinc-900 text-sm">Instant Clipboard Beam</h3>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono">Broadcast to Subnet</span>
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL, code snippet, or note to beam instantly..."
          className="flex-1 px-3.5 py-2 rounded-xl text-sm bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-zinc-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Beam</span>
        </button>
      </form>

      {/* Received Clipboard Toast */}
      {recentReceived && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3 animate-fade-in">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
              Beamed from {recentReceived.senderName}
            </span>
            <p className="text-xs text-zinc-800 font-mono truncate mt-0.5" title={recentReceived.text}>
              {recentReceived.text}
            </p>
          </div>
          <button
            onClick={handleCopyRecent}
            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
