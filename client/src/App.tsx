import React, { useState } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { PeerCard } from './components/PeerCard';
import { TransferModal } from './components/TransferModal';
import { TransferProgress } from './components/TransferProgress';
import { ReceivedFilesDrawer } from './components/ReceivedFilesDrawer';
import { RoomCodeSwitcher } from './components/RoomCodeSwitcher';
import { SecretBeamModal } from './components/SecretBeamModal';
import { getPeerTheme } from './utils/names';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Layers, 
  Edit2, 
  Check, 
  Radio,
  Share2,
  HardDrive,
  FolderTree,
} from 'lucide-react';

export function App() {
  const {
    self,
    myIP,
    peers,
    roomCode,
    isCustomRoom,
    isConnected,
    activeTransfers,
    pendingConsent,
    secretNotes,
    receivedFiles,
    dismissReceivedFile,
    sendFiles,
    respondConsent,
    sendSecretNote,
    decryptSecretNote,
    joinCustomRoom,
    resetToSubnetRoom,
    updateDeviceName,
  } = useWebRTC();

  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(self.name);
  const selfTheme = getPeerTheme(self.id);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      updateDeviceName(customName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Header & Presence Capsule */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-200/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
            <Share2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                LAN Courier
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                v2.0 P2P
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Zero-Cloud Peer-to-Peer File & Secret Sharing
            </p>
          </div>
        </div>

        {/* Controls: Connection Pill, Room Switcher, Secret Beam */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm text-xs font-medium">
            {isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-800 font-medium">Connected</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">Connecting...</span>
              </>
            )}
          </div>

          {/* Feature 1: Manual 6-Digit PIN Room Switcher */}
          <RoomCodeSwitcher
            roomCode={roomCode}
            isCustomRoom={isCustomRoom}
            onJoinCustomRoom={joinCustomRoom}
            onResetToSubnet={resetToSubnetRoom}
          />

          {/* Feature 3: End-to-End Encrypted Secret Vault */}
          <SecretBeamModal
            peers={peers}
            secretNotes={secretNotes}
            onSendSecret={sendSecretNote}
            onDecryptSecret={decryptSecretNote}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 space-y-8">
        {/* AirDrop-Style Current Device Identity Banner */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${selfTheme.bg} shadow-sm`}>
              YOU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  Your Visible Device
                </span>
                <span className="text-xs text-zinc-400 font-mono">{self.id.slice(0, 8)}...</span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">
                {self.name || 'Anonymous Device'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200 text-zinc-700 font-mono shadow-xs">
              <span className="text-zinc-500">Your IP:</span>
              <strong className="text-emerald-700 font-bold">{myIP || 'Detecting...'}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200 text-amber-900 font-mono shadow-xs">
              <span>Room: #{roomCode || 'AUTO-SUBNET'}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LAN Direct</span>
            </div>
          </div>
        </div>

        {/* Discovered Peers Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
                Nearby Devices ({peers.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Multi-File & Directory Drag & Drop Ready</span>
            </span>
          </div>

          {peers.length === 0 ? (
            <div className="editorial-card rounded-3xl p-8 sm:p-12 text-center border-dashed border-2 border-zinc-300 bg-white/60 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <Wifi className="w-7 h-7 animate-pulse" />
              </div>

              <h3 className="font-serif text-xl font-bold text-zinc-900">
                No other devices connected yet
              </h3>
              
              <p className="text-xs text-zinc-500 max-w-md mt-1.5 leading-relaxed">
                To share a file peer-to-peer, open LAN Courier on your phone or a second browser tab. Each connected device will appear here as a card.
              </p>

              {/* Action Buttons: Open 2nd Tab or Connect Phone */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-md transition-all hover:scale-105"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open 2nd Window to Test</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Copied URL to clipboard! Open this URL on your phone.');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold border border-zinc-300 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copy Link for Phone</span>
                </button>
              </div>

              {/* Quick Staging Dropzone */}
              <div className="mt-8 pt-6 border-t border-zinc-200/80 w-full max-w-lg">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Or Pre-Select Files / Folder
                </p>
                <div className="flex items-center justify-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors">
                    <HardDrive className="w-4 h-4" />
                    <span>Select Files to Prepare</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          alert(`Selected ${e.target.files.length} file(s)! Now connect your second device to beam.`);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {peers.map((peer) => (
                <PeerCard
                  key={peer.id}
                  peer={peer}
                  onSendFiles={sendFiles}
                />
              ))}
            </div>
          )}
        </section>

        {/* Active & Completed Transfers Monitor */}
        <section>
          <TransferProgress transfers={activeTransfers} />
        </section>
      </main>

      {/* Consent Modal */}
      <TransferModal
        request={pendingConsent}
        onAccept={(id) => respondConsent(id, true)}
        onDecline={(id) => respondConsent(id, false)}
      />

      {/* Received Files Download Card / Modal with Native Share */}
      <ReceivedFilesDrawer
        files={receivedFiles}
        onDismiss={dismissReceivedFile}
      />

      {/* Bottom Sticky User Device Identity Card */}
      <footer className="mt-8 pt-4">
        <div className="editorial-card rounded-3xl p-5 border border-zinc-200/90 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${selfTheme.bg} shadow-sm`}>
              {self.name.split(' ').map((w) => w[0]).join('')}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Your Moniker
                </span>
                <span className="text-xs text-zinc-400 font-mono truncate">{self.id.slice(0, 8)}...</span>
              </div>

              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                    className="px-2 py-0.5 rounded text-sm font-semibold text-zinc-900 border border-blue-400 focus:outline-none"
                  />
                  <button type="submit" className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="font-semibold text-zinc-900 text-base truncate">
                    {self.name}
                  </h4>
                  <button
                    onClick={() => {
                      setCustomName(self.name);
                      setIsEditingName(true);
                    }}
                    className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors"
                    title="Rename Device"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-zinc-400" />
              <span>WebRTC 64KB Slices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AES-256-GCM Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Zero-Cloud Storage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
