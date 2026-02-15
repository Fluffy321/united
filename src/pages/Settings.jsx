import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Camera, LogOut, Shield, Bell, UserCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import UserAvatar from '@/components/common/UserAvatar';
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
import CitySelector from '@/components/common/CitySelector';

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech", 
  "Food", "Travel", "Volunteering", "Fashion", "Gaming",
  "Fitness", "Reading", "Photography", "Movies", "Outdoors"
];

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [cityPreset, setCityPreset] = useState('');
  const [cityCustom, setCityCustom] = useState('');
  const [cityState, setCityState] = useState('');
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
    setCityPreset(user.cityPreset || 'Lawrence');
    setCityCustom(user.cityCustom || '');
    setCityState(user.cityState || '');
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file (JPG or PNG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!avatarPreview && !avatarFile) {
      toast.error('Profile photo is required');
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = currentUser?.avatar_url;
      if (avatarFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = file_url;
      }

      await base44.auth.updateMe({
        display_name: displayName.trim(),
        cityPreset,
        cityCustom,
        cityState,
        bio: bio.trim(),
        interests,
        avatar_url: avatarUrl
      });

      setIsSaving(false);
      toast.success('Profile updated');
      loadUser();
    } catch (error) {
      toast.error('Failed to update profile');
      setIsSaving(false);
    }
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
            {/* Profile Photo */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex flex-col items-center gap-4">
                {avatarPreview ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg">
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => document.getElementById('avatar-upload').click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                      <UserCircle className="w-16 h-16 text-slate-400" />
                    </div>
                    <p className="text-sm text-red-600 font-medium mb-2">Profile photo required</p>
                  </div>
                )}

                <input 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png" 
                  id="avatar-upload" 
                  className="hidden" 
                  onChange={handleAvatarChange} 
                />
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => document.getElementById('avatar-upload').click()}
                >
                  <Camera className="w-4 h-4" />
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>

                <p className="text-xs text-slate-500 text-center max-w-xs">
                  Use a clear photo of yourself. JPG or PNG, max 5MB.
                </p>
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

              <CitySelector 
                cityPreset={cityPreset}
                cityCustom={cityCustom}
                cityState={cityState}
                onChange={({ cityPreset: cp, cityCustom: cc, cityState: cs }) => {
                  setCityPreset(cp || '');
                  setCityCustom(cc || '');
                  setCityState(cs || '');
                }}
              />

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