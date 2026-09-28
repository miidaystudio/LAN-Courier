import React, { useState, useRef } from 'react';
import { Peer } from '../types';
import { getPeerTheme } from '../utils/names';
import { parseDroppedItems, FileItem } from '../utils/fileTree';
import { Laptop, Smartphone, Tablet, Upload, FolderUp, ShieldCheck, Sparkles } from 'lucide-react';

interface PeerCardProps {
  peer: Peer;
  onSendFiles: (peerId: string, items: FileItem[]) => void;
}

export const PeerCard: React.FC<PeerCardProps> = ({ peer, onSendFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const theme = getPeerTheme(peer.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = await parseDroppedItems(e.dataTransfer);
    if (items.length > 0) {
      onSendFiles(peer.id, items);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: FileItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        relativePath: f.name,
      }));
      onSendFiles(peer.id, items);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: FileItem[] = Array.from(e.target.files).map((f) => ({
        file: f,
        relativePath: (f as any).webkitRelativePath || f.name,
      }));
      onSendFiles(peer.id, items);
    }
  };

  const renderDeviceIcon = () => {
    switch (peer.deviceType) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5" />;
      default:
        return <Laptop className="w-3.5 h-3.5" />;
    }
  };

  const displayIP = peer.ipAddress || peer.ip || 'LAN Peer';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group rounded-3xl p-5 sm:p-6 transition-all duration-300 bg-[#0D0D10]/90 backdrop-blur-xl border ${
        isDragOver
          ? 'border-white/40 bg-white/[0.08] shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]'
          : 'border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-white/20 hover:bg-[#131317]'
      }`}
    >
      {/* Hidden File & Folder Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        className="hidden"
        {...({ webkitdirectory: '', directory: '' } as any)}
      />

      <div className="flex items-start justify-between gap-3">
        {/* Device Initials Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${theme.bg} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          {peer.deviceName.split(' ').map((w) => w[0]).join('')}
        </div>

        {/* Device Type Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-zinc-300 border border-white/10">
          {renderDeviceIcon()}
          <span className="capitalize">{peer.deviceType || 'Desktop'}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-lg tracking-tight truncate" title={peer.deviceName}>
            {peer.deviceName}
          </h3>
          <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse flex-shrink-0`} title="Connected" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="font-mono text-[11px] text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg font-medium">
            IP: <strong className="text-emerald-400 font-semibold">{displayIP}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>P2P Direct</span>
          </span>
        </div>
      </div>

      {/* Tactile "Tap or Drop to Beam" Action Target */}
      <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98] group/btn"
        >
          <Upload className="w-3.5 h-3.5 text-black group-hover/btn:translate-y-[-1px] transition-transform" />
          <span>Tap or Drop to Beam</span>
        </button>

        <button
          onClick={() => folderInputRef.current?.click()}
          title="Send Entire Folder"
          className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10 text-xs transition-colors active:scale-[0.98]"
        >
          <FolderUp className="w-4 h-4" />
        </button>
      </div>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-black/80 rounded-3xl border-2 border-dashed border-white/40 flex flex-col items-center justify-center backdrop-blur-md pointer-events-none animate-fade-in">
          <Sparkles className="w-8 h-8 text-white animate-bounce mb-1" />
          <p className="text-xs font-bold text-white">Release to beam files instantly</p>
        </div>
      )}
    </div>
  );
};
