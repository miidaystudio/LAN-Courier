import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Wifi, X, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  myIP: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ myIP }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute live local LAN URL
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  const activeHost = myIP || window.location.hostname;
  const pairUrl = `${protocol}//${activeHost}${port}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pairUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 text-[#0F172A] border border-stone-200/90 shadow-bento transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Pair Phone via QR Code"
      >
        <QrCode className="w-3.5 h-3.5 text-[#E8A87C]" />
        <span>Pair Device</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FBF9F5] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-stone-200 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors border border-stone-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#0F172A] p-2 flex items-center justify-center shadow-md border border-stone-800">
                <img src="/logo.svg" alt="LAN Courier Studio" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0F172A] leading-tight">
                  Mobile QR Pairing
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">Scan from phone on same Wi-Fi</p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center border border-stone-200/90 shadow-bento mb-5">
              <div className="p-3 bg-white rounded-2xl border border-stone-100 shadow-inner">
                <QRCodeSVG
                  value={pairUrl}
                  size={190}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-500 font-mono text-center">
                <Wifi className="w-3.5 h-3.5 text-[#41B3A3] animate-pulse" />
                <span>{pairUrl}</span>
              </div>
            </div>

            {/* Step Instructions */}
            <div className="space-y-2 mb-5 text-xs text-stone-700 bg-[#E8A87C]/15 p-4 rounded-2xl border border-[#E8A87C]/30">
              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#E8A87C] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Connect your mobile device to the same Wi-Fi network.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#E8A87C] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Scan this QR code with the Camera app to beam files.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#41B3A3]" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.open(pairUrl, '_blank')}
                title="Open in new window"
                className="p-2.5 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
