import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWebRTC } from './hooks/useWebRTC';
import { PeerCard } from './components/PeerCard';
import { TransferModal } from './components/TransferModal';
import { TransferHUD } from './components/TransferHUD';
import { TransferLedger } from './components/TransferLedger';
import { ReceivedFilesDrawer } from './components/ReceivedFilesDrawer';
import { RoomCodeSwitcher } from './components/RoomCodeSwitcher';
import { SecretBeamModal } from './components/SecretBeamModal';
import { getPeerTheme, formatBytes } from './utils/names';
import { FileItem, parseDroppedItems } from './utils/fileTree';
import { 
  WifiOff, 
  ShieldCheck, 
  Layers, 
  Edit2, 
  Check, 
  Radio,
  Share2,
  HardDrive,
  FolderTree,
  Upload,
  Copy,
  ExternalLink,
  Film,
  Sparkles,
  PlusCircle,
  Trash2,
  Send,
  Smartphone,
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
    transferLedger,
    clearTransferLedger,
    dismissReceivedFile,
    sendFiles,
    respondConsent,
    sendSecretNote,
    decryptSecretNote,
    joinCustomRoom,
    resetToSubnetRoom,
    simulatePeer,
    updateDeviceName,
  } = useWebRTC();

  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(self.name);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<FileItem[]>([]);
  const [isStagingDragOver, setIsStagingDragOver] = useState(false);
  const stagingInputRef = useRef<HTMLInputElement>(null);

  const selfTheme = getPeerTheme(self.id);

  // Compute live local LAN URL for QR Code pairing
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  const activeHost = myIP || window.location.hostname;
  const localPairUrl = `${protocol}//${activeHost}${port}`;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      updateDeviceName(customName.trim());
      setIsEditingName(false);
    }
  };

  const handleCopyPairUrl = () => {
    navigator.clipboard.writeText(localPairUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleStagingFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: FileItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        relativePath: f.name,
      }));
      setStagedFiles((prev) => [...prev, ...items]);
    }
  };

  const handleStagingDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsStagingDragOver(false);
    const items = await parseDroppedItems(e.dataTransfer);
    if (items.length > 0) {
      setStagedFiles((prev) => [...prev, ...items]);
    }
  };

  const removeStagedItem = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const beamStagedToPeer = (targetPeerId: string) => {
    if (stagedFiles.length === 0) return;
    sendFiles(targetPeerId, stagedFiles);
    setStagedFiles([]);
  };

  const totalStagedSize = stagedFiles.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-8 max-w-7xl mx-auto selection:bg-white/20 selection:text-white font-sans relative">
      {/* Top Ambient Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Top Navigation Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[#0D0D10] p-2.5 flex items-center justify-center border border-white/[0.12] ring-1 ring-white/5 overflow-hidden group hover:scale-105 transition-all duration-300 flex-shrink-0 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            <img src="/logo.svg" alt="CourierStudio Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                CourierStudio
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/10">
                Local P2P Beam Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Zero-Cloud Local Area Media Beam & Encrypted Secret Vault
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Connection Status Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D0D10] border border-white/[0.08] text-xs font-semibold text-zinc-300">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-white font-medium">Engine Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-400">Connecting...</span>
              </>
            )}
          </div>

          {/* Simulate Peer Shortcut */}
          <button
            onClick={simulatePeer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Create a simulated peer node to test media beam locally"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>Simulate Peer</span>
          </button>

          {/* 6-Digit PIN Room Switcher */}
          <RoomCodeSwitcher
            roomCode={roomCode}
            isCustomRoom={isCustomRoom}
            onJoinCustomRoom={joinCustomRoom}
            onResetToSubnet={resetToSubnetRoom}
          />

          {/* Encrypted Secret Beam Vault */}
          <SecretBeamModal
            peers={peers}
            secretNotes={secretNotes}
            onSendSecret={sendSecretNote}
            onDecryptSecret={decryptSecretNote}
          />
        </div>
      </header>

      {/* 2. Main 2-Column Bento Deck Layout */}
      <main className="flex-1 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* LEFT DECK: Active Node & Discovered Peer Radar (Cols 1 to 7) */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Host Node Card */}
            <div className="bg-[#0D0D10]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-base border ${selfTheme.bg} shadow-sm`}>
                    YOU
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 bg-white/[0.06] px-2.5 py-0.5 rounded-md border border-white/10">
                        Host Node
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{self.id.slice(0, 8)}</span>
                    </div>

                    {isEditingName ? (
                      <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          autoFocus
                          className="px-2.5 py-0.5 rounded-lg text-base font-bold text-white border border-white/30 focus:outline-none bg-black/60"
                        />
                        <button type="submit" className="p-1 rounded-lg bg-white text-black hover:bg-zinc-200">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xl font-bold text-white">
                          {self.name || 'Anonymous Studio Device'}
                        </p>
                        <button
                          onClick={() => {
                            setCustomName(self.name);
                            setIsEditingName(true);
                          }}
                          className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors"
                          title="Rename Node"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-mono">
                    <span className="text-zinc-500">Host IP:</span>
                    <strong className="text-emerald-400 font-bold">{myIP || 'Detecting LAN IP...'}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-mono">
                    <span>Room: {roomCode || '#STUDIO-LAN'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct P2P</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Transfer Speed Gauge & Live Transits HUD */}
            {activeTransfers.length > 0 && (
              <section className="animate-fade-in">
                <TransferHUD transfers={activeTransfers} />
              </section>
            )}

            {/* Discovered Nearby Receivers Mesh */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                    Nearby Receivers Mesh ({peers.length})
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Drag & Drop Ready</span>
                </span>
              </div>

              {peers.length === 0 ? (
                <div className="rounded-3xl p-8 sm:p-12 text-center border-dashed border-2 border-white/10 bg-[#0D0D10]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-3xl bg-black p-3.5 flex items-center justify-center mb-4 shadow-2xl border border-white/10 ring-1 ring-white/5">
                    <img src="/logo.svg" alt="CourierStudio Discovery" className="w-full h-full object-contain" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    No other devices discovered on this network yet
                  </h3>
                  
                  <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
                    Scan the Instant QR Dock on the right with your phone, open CourierStudio in a 2nd window, or click <strong>Simulate Peer</strong> above to test beaming 4K video.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={simulatePeer}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
                      <span>Simulate Peer Device</span>
                    </button>

                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold border border-white/10 transition-all hover:scale-105 active:scale-98"
                    >
                      <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Open 2nd Window</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Recent Transfer Audit Ledger */}
            <section>
              <TransferLedger
                ledger={transferLedger}
                onClearLedger={clearTransferLedger}
              />
            </section>
          </div>

          {/* RIGHT DECK: Staging Bay & Instant QR Pairing Dock (Cols 8 to 12) */}
          <div className="lg:col-span-5 space-y-7">
            
            {/* 1. Instant QR Pairing Dock */}
            <div className="bg-[#0D0D10]/90 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-xs">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Instant QR Pairing Dock
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">Scan to join Wi-Fi mesh instantly</p>
                  </div>
                </div>

                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" title="Ready for scan" />
              </div>

              {/* Embedded QR Code Container */}
              <div className="p-4 bg-black/60 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center">
                <div className="p-3.5 bg-white rounded-2xl shadow-md">
                  <QRCodeSVG
                    value={localPairUrl}
                    size={170}
                    level="M"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#050505"
                  />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 font-mono text-center">
                  <span className="font-semibold text-zinc-300">{localPairUrl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCopyPairUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all active:scale-[0.98]"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Local URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.open(localPairUrl, '_blank')}
                  title="Open test client in new tab"
                  className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Media Staging Bay (4K Video, High-Res Photos & Large Files) */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsStagingDragOver(true); }}
              onDragLeave={() => setIsStagingDragOver(false)}
              onDrop={handleStagingDrop}
              className={`bg-[#0D0D10]/90 backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 ${
                isStagingDragOver 
                  ? 'border-white/30 bg-white/[0.04] ring-1 ring-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)]' 
                  : 'border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shadow-xs">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Media Staging Bay
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">Stage 4K videos & photos before beaming</p>
                  </div>
                </div>

                {stagedFiles.length > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-black">
                    {stagedFiles.length} item{stagedFiles.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Hidden File Input for Staging */}
              <input
                type="file"
                multiple
                accept="video/*,image/*,application/*"
                ref={stagingInputRef}
                onChange={handleStagingFiles}
                className="hidden"
              />

              {/* Staged Items List or Dropzone */}
              {stagedFiles.length === 0 ? (
                <div 
                  onClick={() => stagingInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/25 hover:bg-white/[0.02] cursor-pointer flex flex-col items-center justify-center text-center transition-all group"
                >
                  <Upload className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                  <p className="text-xs font-bold text-white">Drop 4K Videos, Photos or Files</p>
                  <p className="text-[11px] text-zinc-500 mt-1">or click to browse from device</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {stagedFiles.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Film className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate" title={item.file.name}>
                              {item.file.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {item.file.type || 'video/mp4'} • {formatBytes(item.file.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeStagedItem(idx)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 pt-2 border-t border-white/[0.08]">
                    <span>Total Batch Size:</span>
                    <span className="font-mono text-white">{formatBytes(totalStagedSize)}</span>
                  </div>

                  {/* Add More Files Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => stagingInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add More</span>
                    </button>

                    <button
                      onClick={() => setStagedFiles([])}
                      className="py-2 px-3 rounded-full text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Beam Staged Media to Peer Actions */}
                  {peers.length > 0 ? (
                    <div className="pt-3 border-t border-white/[0.08]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        Beam Staged Media To:
                      </p>
                      <div className="space-y-1.5">
                        {peers.map((peer) => (
                          <button
                            key={peer.id}
                            onClick={() => beamStagedToPeer(peer.id)}
                            className="w-full flex items-center justify-between p-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md group/btn"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Send className="w-3.5 h-3.5 text-black group-hover/btn:translate-x-0.5 transition-transform" />
                              <span className="truncate">{peer.deviceName}</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600">
                              {peer.ipAddress || peer.ip || 'LAN'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs text-center mt-2">
                      Connect a receiver node or click <strong>Simulate Peer</strong> to beam these staged files.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AirDrop-Style Consent Modal */}
      <TransferModal
        request={pendingConsent}
        onAccept={(id) => respondConsent(id, true)}
        onDecline={(id) => respondConsent(id, false)}
      />

      {/* Received Files Download Drawer */}
      <ReceivedFilesDrawer
        files={receivedFiles}
        onDismiss={dismissReceivedFile}
      />

      {/* 3. Bottom Sticky Device Bar */}
      <footer className="mt-8 pt-4">
        <div className="bg-[#0D0D10]/90 backdrop-blur-xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* User Initials Avatar */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border ${selfTheme.bg} shadow-sm`}>
              {self.name.split(' ').map((w) => w[0]).join('')}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
                  Device Moniker
                </span>
                <span className="text-xs text-zinc-500 font-mono truncate">{self.id.slice(0, 8)}</span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <h4 className="font-semibold text-white text-sm truncate">
                  {self.name}
                </h4>
                <button
                  onClick={() => {
                    setCustomName(self.name);
                    setIsEditingName(true);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors"
                  title="Rename Device"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.08] font-medium">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              <span>64KB Slices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>Zero Cloud</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
