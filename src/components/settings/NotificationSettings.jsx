import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Users, AtSign, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function NotificationSettings({ userId }) {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const result = await base44.entities.NotificationPreference.filter({ user_id: userId });
      if (result[0]) {
        setPrefs(result[0]);
      } else {
        // Create default preferences
        const newPrefs = await base44.entities.NotificationPreference.create({
          user_id: userId,
          replies_enabled: true,
          group_activity_enabled: false,
          mentions_enabled: true,
        });
        setPrefs(newPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification settings');
    }
    setLoading(false);
  };

  const handleToggle = async (field) => {
    if (!prefs) return;
    
    setSaving(true);
    try {
      const updated = await base44.entities.NotificationPreference.update(prefs.id, {
        [field]: !prefs[field],
      });
      setPrefs(updated);
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-slate-600" />
        <h3 className="text-[15px] font-bold text-slate-900">Notification Preferences</h3>
      </div>

      <div className="space-y-3">
        {/* Replies */}
        <NotificationToggle
          icon={MessageSquare}
          label="Replies & Comments"
          desc="Get notified when someone replies to your posts"
          enabled={prefs.replies_enabled}
          onToggle={() => handleToggle('replies_enabled')}
          disabled={saving}
        />

        {/* Group Activity */}
        <NotificationToggle
          icon={Users}
          label="Group Activity"
          desc="Get notified on new posts in your groups"
          enabled={prefs.group_activity_enabled}
          onToggle={() => handleToggle('group_activity_enabled')}
          disabled={saving}
        />

        {/* Mentions */}
        <NotificationToggle
          icon={AtSign}
          label="Mentions"
          desc="Get notified when someone mentions you"
          enabled={prefs.mentions_enabled}
          onToggle={() => handleToggle('mentions_enabled')}
          disabled={saving}
        />
      </div>

      <div className="mt-6 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-[12px] text-blue-700">
          💡 <span className="font-medium">Pro tip:</span> Keep replies enabled to stay engaged with your community discussions.
        </p>
      </div>
    </div>
  );
}

function NotificationToggle({ icon: Icon, label, desc, enabled, onToggle, disabled }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900">{label}</p>
        <p className="text-[12px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ${
          enabled ? 'bg-green-500' : 'bg-slate-200'
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}