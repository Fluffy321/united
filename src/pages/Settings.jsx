import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Camera, LogOut, Shield, Bell, UserCircle, Image, Smile, Type } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import UserAvatar from '@/components/common/UserAvatar';
import AvatarPicker from '@/components/profile/AvatarPicker';
import ThemePicker from '@/components/profile/ThemePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech", 
  "Food", "Travel", "Volunteering", "Fashion", "Gaming",
  "Fitness", "Reading", "Photography", "Movies", "Outdoors"
];

const CITIES = ["Five Towns", "Brooklyn", "Manhattan", "Queens", "Long Island"];

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('Five Towns');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarType, setAvatarType] = useState('initials');
  const [avatarPresetId, setAvatarPresetId] = useState(null);
  const [avatarTheme, setAvatarTheme] = useState('ocean-blue');
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    messages: true,
    comments: true,
    likes: false,
    prompts: true
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
    setDisplayName(user.display_name || user.full_name?.split(' ')[0] || '');
    setCity(user.city || 'Five Towns');
    setBio(user.bio || '');
    setInterests(user.interests || []);
    setAvatarPreview(user.avatar_url);
    setAvatarType(user.avatar_type || 'initials');
    setAvatarPresetId(user.avatar_preset_id || 'smile');
    setAvatarTheme(user.avatar_theme || 'ocean-blue');
    setNotifications(user.notification_settings || {
      messages: true,
      comments: true,
      likes: false,
      prompts: true
    });
  };

  const toggleInterest = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    let avatarUrl = currentUser?.avatar_url;
    if (avatarFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
      avatarUrl = file_url;
    } else if (avatarPreview === null && avatarType === 'photo') {
      avatarUrl = null;
    }

    await base44.auth.updateMe({
      display_name: displayName.trim(),
      city,
      bio: bio.trim(),
      interests,
      avatar_url: avatarUrl,
      avatar_type: avatarType,
      avatar_preset_id: avatarType === 'avatar' ? avatarPresetId : null,
      avatar_theme: avatarType === 'avatar' ? avatarTheme : null,
      avatar_updated_at: new Date().toISOString()
    });

    setIsSaving(false);
    toast.success('Profile updated');
    loadUser();
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await base44.auth.updateMe({ notification_settings: notifications });
    setIsSaving(false);
    toast.success('Notification settings updated');
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="profile" className="flex-1 gap-2">
              <UserCircle className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <UserAvatar user={{...currentUser, display_name: displayName, avatar_type: avatarType, avatar_url: avatarPreview, avatar_preset_id: avatarPresetId, avatar_theme: avatarTheme}} size="xl" />
            </div>

            {/* Avatar Type Selection */}
            <div className="bg-white rounded-xl p-6 space-y-4">
              <Label>Profile Look</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAvatarType('photo')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    avatarType === 'photo' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Image className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm font-medium">Photo</p>
                </button>
                
                <button
                  onClick={() => setAvatarType('avatar')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    avatarType === 'avatar' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Smile className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm font-medium">Avatar</p>
                </button>
                
                <button
                  onClick={() => setAvatarType('initials')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    avatarType === 'initials' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Type className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm font-medium">Initials</p>
                </button>
              </div>

              {/* Photo Upload */}
              {avatarType === 'photo' && (
                <div className="pt-4 border-t space-y-3">
                  <input type="file" accept="image/jpeg,image/png,image/heic,image/jpg" id="avatar" className="hidden" onChange={handleAvatarChange} />
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => document.getElementById('avatar').click()}
                  >
                    <Camera className="w-4 h-4" />
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {avatarPreview && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveAvatar}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              )}

              {/* Avatar Picker */}
              {avatarType === 'avatar' && (
                <div className="pt-4 border-t space-y-4">
                  <AvatarPicker 
                    selectedPreset={avatarPresetId}
                    onSelect={setAvatarPresetId}
                  />
                  <ThemePicker 
                    selectedTheme={avatarTheme}
                    onSelect={setAvatarTheme}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 space-y-4">
              <div>
                <Label>Display Name</Label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-1 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</p>
              </div>

              <div>
                <Label>Interests (up to 5)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INTERESTS.map(interest => (
                    <Badge 
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        interests.includes(interest) 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : 'hover:bg-slate-100'
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="bg-white rounded-xl p-6 space-y-4">
              {[
                { key: 'messages', label: 'New messages', desc: 'Get notified when someone sends you a message' },
                { key: 'comments', label: 'Comments', desc: 'Get notified when someone comments on your posts' },
                { key: 'likes', label: 'Likes', desc: 'Get notified when someone likes your posts' },
                { key: 'prompts', label: 'Daily prompts', desc: 'Get notified about new community prompts' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              ))}

              <Button 
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Your Information</h3>
                <p className="text-sm text-slate-500">
                  Your age range ({currentUser.age_range || '18+'}) is visible on your profile and messages for safety purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Blocked Users</h3>
                <p className="text-sm text-slate-500">
                  Users you block won't be able to see your posts or send you messages.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Data & Privacy</h3>
                <p className="text-sm text-slate-500">
                  Your data is stored securely. Contact support for data requests.
                </p>
              </div>

              <div className="pt-4 border-t">
                <a 
                  href="https://united.community/guidelines" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  📋 Community Guidelines & Safety Rules
                </a>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}