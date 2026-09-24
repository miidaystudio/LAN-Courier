import React, { useState, useRef } from 'react';
import { Peer } from '../types';
import { getPeerTheme } from '../utils/names';
import { parseDroppedItems, FileItem } from '../utils/fileTree';
import { Laptop, Smartphone, Tablet, Upload, FolderUp } from 'lucide-react';

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
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group rounded-3xl p-6 transition-all duration-300 editorial-card ${
        isDragOver
          ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/70 border-blue-300'
          : 'editorial-card-hover border-zinc-200/80 hover:border-zinc-300'
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

      <div className="flex items-start justify-between">
        {/* Animal Avatar */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border ${theme.bg} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          {peer.deviceName.split(' ').map((w) => w[0]).join('')}
        </div>

        {/* Device Type Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
          {renderDeviceIcon()}
          <span className="capitalize">{peer.deviceType || 'Desktop'}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900 text-base tracking-tight truncate">
            {peer.deviceName}
          </h3>
          <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} title="Online" />
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-mono text-[11px] text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg">
            IP: <strong className="text-zinc-800 font-semibold">{peer.ipAddress || peer.ip || 'LAN Peer'}</strong>
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Direct P2P</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Send Files</span>
        </button>

        <button
          onClick={() => folderInputRef.current?.click()}
          title="Send Entire Folder"
          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs transition-colors"
        >
          <FolderUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drag Overlay with Folder Support */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-600/10 rounded-3xl border-2 border-dashed border-blue-500 flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none">
          <Upload className="w-8 h-8 text-blue-600 animate-bounce mb-1" />
          <p className="text-xs font-bold text-blue-900">Drop files or folders to beam</p>
        </div>
      )}
    </div>
  );
};
