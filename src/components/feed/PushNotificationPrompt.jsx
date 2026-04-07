import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

const STORAGE_KEY = 'push_notif_prompt_dismissed';

export default function PushNotificationPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === '1' || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
  });
  const [requesting, setRequesting] = useState(false);

  if (dismissed) return null;
  if (typeof Notification === 'undefined') return null;
  if (Notification.permission === 'granted') return null;

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Five Towns Alerts enabled! 🔔', {
          body: 'You\'ll be notified about community alerts, help requests, and events.',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
    setRequesting(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2 flex items-center gap-2.5">
      <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-blue-700 font-semibold text-[12px] leading-tight">Enable community notifications</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-[11px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-70"
        >
          {requesting ? '…' : 'Enable'}
        </button>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}