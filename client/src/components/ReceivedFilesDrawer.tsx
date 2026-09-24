import React from 'react';
import { ReceivedFile } from '../types';
import { formatBytes } from '../utils/names';
import { Download, Share, FileText, CheckCircle2, X, Video, FileAudio } from 'lucide-react';

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
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200">
          <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (file.type.startsWith('video/')) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200">
          <Video className="w-7 h-7" />
        </div>
      );
    }
    if (file.type.startsWith('audio/')) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
          <FileAudio className="w-7 h-7" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200">
        <FileText className="w-7 h-7" />
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-50 space-y-3 animate-fade-in pointer-events-auto">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50/40 to-white"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Received from {file.senderName}</span>
            </div>
            <button
              onClick={() => onDismiss(file.id)}
              className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {renderPreview(file)}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-zinc-900 truncate" title={file.name}>
                {file.name}
              </h4>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>

          {/* Action Buttons for Mobile & Desktop */}
          <div className="flex items-center gap-2">
            <a
              href={file.downloadUrl}
              download={file.name}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-98 text-center"
            >
              <Download className="w-4 h-4" />
              <span>Save / Download</span>
            </a>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => handleNativeShare(file)}
                title="Save to Camera Roll / Files / Share"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Share className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
