import React from 'react';
import { ReceivedFile } from '../types';
import { formatBytes } from '../utils/names';
import { Download, Share2, FileText, CheckCircle2, X, Video, FileAudio } from 'lucide-react';

interface ReceivedFilesDrawerProps {
  files: ReceivedFile[];
  onDismiss: (id: string) => void;
}

export const ReceivedFilesDrawer: React.FC<ReceivedFilesDrawerProps> = ({ files, onDismiss }) => {
  if (files.length === 0) return null;

  const handleNativeShare = async (file: ReceivedFile) => {
    if (navigator.share && navigator.canShare) {
      try {
        const fileObj = new File([file.blob], file.name, { type: file.type });
        if (navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: file.name,
          });
          return;
        }
      } catch (err) {
        console.warn('[Share Sheet] Share cancelled or unsupported', err);
      }
    }
    // Fallback: trigger download link directly
    const a = document.createElement('a');
    a.href = file.downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderPreview = (file: ReceivedFile) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 flex-shrink-0 border border-white/10">
          <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (file.type.startsWith('video/')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
          <Video className="w-6 h-6" />
        </div>
      );
    }
    if (file.type.startsWith('audio/')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
          <FileAudio className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
        <FileText className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-50 space-y-3 animate-fade-in pointer-events-auto">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-[#0D0D10]/95 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.8)] border border-emerald-500/40"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Received from {file.senderName}</span>
            </div>
            <button
              onClick={() => onDismiss(file.id)}
              className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {renderPreview(file)}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate" title={file.name}>
                {file.name}
              </h4>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={file.downloadUrl}
              download={file.name}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-[0.98] text-center"
            >
              <Download className="w-4 h-4" />
              <span>Save / Download</span>
            </a>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => handleNativeShare(file)}
                title="Share Sheet"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
