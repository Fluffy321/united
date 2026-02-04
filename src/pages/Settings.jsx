import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Camera, LogOut, Shield, Bell, UserCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

  const handleSaveProfile = async () => {
    setIsSaving(true);

    let avatarUrl = currentUser?.avatar_url;
    if (avatarFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
      avatarUrl = file_url;
    }

    await base44.auth.updateMe({
      display_name: displayName.trim(),
      city,
      bio: bio.trim(),
      interests,
      avatar_url: avatarUrl
    });

    setIsSaving(false);
    toast.success('Profile updated');
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
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-white font-bold">
                      {displayName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <input type="file" accept="image/*" id="avatar" className="hidden" onChange={handleAvatarChange} />
                <label 
                  htmlFor="avatar" 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                </label>
              </div>
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