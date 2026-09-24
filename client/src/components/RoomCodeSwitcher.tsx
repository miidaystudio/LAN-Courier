import React, { useState } from 'react';
import { KeyRound, RefreshCw, Radio, Check, Globe } from 'lucide-react';

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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm transition-colors text-zinc-800"
        title="Switch Room or Enter 6-Digit PIN"
      >
        {isCustomRoom ? (
          <>
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono font-bold text-amber-900 tracking-wider">PIN: {roomCode}</span>
          </>
        ) : (
          <>
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-zinc-700">Subnet: {roomCode || 'Auto'}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-zinc-200 p-4 z-50 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Room Connectivity Mode
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 font-mono"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-zinc-500 mb-3">
            Use a 6-digit PIN if devices are on isolated Wi-Fi (guest networks, mobile hotspots, or VLANs).
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-700">
                  Custom 6-Digit Room PIN
                </label>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Random</span>
                </button>
              </div>
              <input
                type="text"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                placeholder="e.g. 849201"
                className="w-full px-3 py-2 rounded-xl text-center font-mono font-bold text-base tracking-widest bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pinInput.trim().length < 4}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Join PIN Room</span>
              </button>
            </div>
          </form>

          {isCustomRoom && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  onResetToSubnet();
                  setIsOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reset to Auto Wi-Fi Subnet</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
