import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

const STORAGE_KEY = 'push_notif_prompt_dismissed';

export default function PushNotificationPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === '1' || Notification?.permission === 'granted';
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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-3 flex items-center gap-3" style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-[13px] leading-tight">Enable Notifications</p>
        <p className="text-blue-100 text-[11px] mt-0.5">Get alerts for help requests & community updates</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="px-3 py-1.5 bg-white text-blue-700 rounded-full text-[12px] font-bold hover:bg-blue-50 transition-colors disabled:opacity-70"
        >
          {requesting ? '…' : 'Enable'}
        </button>
        <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}