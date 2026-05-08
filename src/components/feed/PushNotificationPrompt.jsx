import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { storageService } from '@/services';

const STORAGE_KEY = 'push_notif_prompt_dismissed';

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return;
    if (storageService.getItem(STORAGE_KEY) === '1') return;
    // Show briefly then auto-dismiss — mark as seen immediately so it never blocks feed again
    storageService.setItem(STORAGE_KEY, '1');
    const show = setTimeout(() => setVisible(true), 1200);
    const hide = setTimeout(() => setVisible(false), 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const dismiss = () => {
    storageService.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await Notification.requestPermission();
    } catch (e) {}
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-blue-50 border border-blue-100">
      <Bell className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
      <p className="flex-1 text-[11px] font-medium text-blue-700 leading-none">Get alerts for help requests & events</p>
      <button
        onClick={handleEnable}
        disabled={requesting}
        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
      >
        {requesting ? '…' : 'Enable'}
      </button>
      <button onClick={dismiss} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
