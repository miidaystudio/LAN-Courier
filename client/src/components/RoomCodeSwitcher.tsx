import React, { useState } from 'react';
import { KeyRound, RefreshCw, Radio, Check, Globe, X } from 'lucide-react';

interface RoomCodeSwitcherProps {
  roomCode: string;
  isCustomRoom: boolean;
  onJoinCustomRoom: (pin: string) => void;
  onResetToSubnet: () => void;
}

export function RoomCodeSwitcher({
  roomCode,
  isCustomRoom,
  onJoinCustomRoom,
  onResetToSubnet,
}: RoomCodeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const generateRandomPin = () => {
    const chars = '0123456789ABCDEF';
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += chars[Math.floor(Math.random() * chars.length)];
    }
    setPinInput(pin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      onJoinCustomRoom(pinInput.trim());
      setIsOpen(false);
      setPinInput('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Switch Room or Enter 6-Digit PIN"
      >
        {isCustomRoom ? (
          <>
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-amber-300 tracking-wider">PIN: #{roomCode}</span>
          </>
        ) : (
          <>
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-zinc-300">Room: {roomCode || '#STUDIO-LAN'}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0D0D10]/95 backdrop-blur-2xl rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] border border-white/[0.12] p-5 z-50 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
            <h4 className="text-base font-bold text-white">
              Studio Mesh Room
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-medium">
            Devices on this Wi-Fi pair via <code className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">#STUDIO-LAN</code>. Enter a 6-digit PIN for isolated VLANs/hotspots.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Custom PIN / Room
                </label>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <input
                type="text"
                maxLength={10}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                placeholder="e.g. 849201"
                className="w-full px-3 py-2 rounded-2xl text-center font-mono font-bold text-base tracking-widest bg-black/60 border border-white/20 text-white focus:outline-none focus:border-white shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={pinInput.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Join Custom PIN Room</span>
            </button>
          </form>

          {isCustomRoom && (
            <div className="mt-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  onResetToSubnet();
                  setIsOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/10 text-xs font-semibold transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset to Default Studio Room</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
