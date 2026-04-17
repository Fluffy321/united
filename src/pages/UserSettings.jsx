import React, { useState, useEffect } from 'react';
import { Upload, Save, Loader2, Bell, Lock, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifications, setNotifications] = useState({
    email_on_post: true,
    email_on_comment: true,
    email_on_follow: true,
    email_on_mention: true,
    push_notifications: true,
    weekly_digest: true,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setBio(currentUser.bio || '');
        setAvatarUrl(currentUser.avatar_url || '');
        if (currentUser.notification_preferences) {
          setNotifications(currentUser.notification_preferences);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        bio,
        avatar_url: avatarUrl,
        notification_preferences: notifications,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">Please sign in to manage your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your profile and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>

          {/* Avatar Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-4">Profile Picture</label>
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <label className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Change'}
                  </button>
                </label>
              </div>
              <div className="flex-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900 mb-1">{user.full_name}</p>
                <p className="text-xs mb-3">{user.email}</p>
                <p className="text-xs leading-relaxed">JPG, PNG or GIF (Max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-3">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              maxLength={160}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white resize-none"
              rows={4}
            />
            <div className="text-xs text-slate-500 mt-2">{bio.length}/160 characters</div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notification Preferences
          </h2>

          <div className="space-y-4">
            <NotificationToggle
              label="New Posts in Your Communities"
              description="Get notified when members post in communities you follow"
              enabled={notifications.email_on_post}
              onChange={() => toggleNotification('email_on_post')}
              icon={<Eye className="w-5 h-5" />}
            />
            <NotificationToggle
              label="Comments on Your Posts"
              description="Get notified when someone replies to your post"
              enabled={notifications.email_on_comment}
              onChange={() => toggleNotification('email_on_comment')}
              icon={<Bell className="w-5 h-5" />}
            />
            <NotificationToggle
              label="New Followers"
              description="Get notified when someone follows you"
              enabled={notifications.email_on_follow}
              onChange={() => toggleNotification('email_on_follow')}
              icon={<Bell className="w-5 h-5" />}
            />
            <NotificationToggle
              label="Mentions"
              description="Get notified when someone mentions you"
              enabled={notifications.email_on_mention}
              onChange={() => toggleNotification('email_on_mention')}
              icon={<Bell className="w-5 h-5" />}
            />
            <NotificationToggle
              label="Push Notifications"
              description="Receive push notifications on your device"
              enabled={notifications.push_notifications}
              onChange={() => toggleNotification('push_notifications')}
              icon={<Lock className="w-5 h-5" />}
            />
            <NotificationToggle
              label="Weekly Community Digest"
              description="Receive a weekly AI-generated summary of activity, events, and new members across your communities"
              enabled={notifications.weekly_digest !== false}
              onChange={() => toggleNotification('weekly_digest')}
              icon={<Bell className="w-5 h-5" />}
            />
          </div>

          {/* Save Notification Preferences */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ label, description, enabled, onChange, icon }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-slate-600 mt-0.5">{icon}</div>
        <div>
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-sm text-slate-600 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}