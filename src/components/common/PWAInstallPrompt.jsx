import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { storageService } from '@/services';

/**
 * PWA Install Prompt — shows the native "Add to Home Screen" prompt
 * on Android and desktop Chrome/Edge. iOS shows a manual instruction banner.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = storageService.getItem('junited_pwa_dismissed');
    if (dismissed) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Android/Desktop: capture the native prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS banner after a short delay
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    storageService.setItem('junited_pwa_dismissed', '1');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="app-floating-banner fixed left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-lg font-bold">
          ✡
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold">Install JUnited</p>
          {isIOS ? (
            <p className="text-[11px] text-slate-300 mt-0.5">
              Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-300 mt-0.5">Add to your home screen for the best experience</p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors flex-shrink-0"
          >
            <Download className="w-3 h-3" />
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
