import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Camera, LogOut, Shield, Bell, UserCircle, X, Trash2, ShieldCheck } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog';
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
import NotificationSettings from '@/components/settings/NotificationSettings';
import VerificationSubmit from '@/components/settings/VerificationSubmit';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
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

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setShowDeleteDialog(false);
    setIsSaving(true);
    try {
      await base44.functions.invoke('deleteUserAccount', { userId: currentUser.id });
      toast.success('Account deleted. Logging out...');
      setTimeout(() => base44.auth.logout(), 1500);
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
      setIsSaving(false);
    }
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
            <TabsTrigger value="verification" className="flex-1 gap-2">
              <ShieldCheck className="w-4 h-4" />
              Verify
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
            <div className="bg-white rounded-xl p-6">
              <NotificationSettings userId={currentUser.id} />
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Identity Verification</h3>
              <p className="text-sm text-slate-400 mb-4">Get a Verified badge to build trust for housing and local help exchanges.</p>
              <VerificationSubmit currentUser={currentUser} />
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="bg-white rounded-xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Who can message you?</h3>
                <p className="text-sm text-slate-400 mb-3">Others will need to send a request if they don't meet this criteria.</p>
                <div className="space-y-2">
                  {[
                    { value: 'everyone', label: 'Anyone', desc: 'Anyone on the app can message you' },
                    { value: 'communities', label: 'People in my communities', desc: 'Only members of shared groups' },
                    { value: 'connections', label: 'Only connections', desc: 'Only people you\'re connected with' },
                    { value: 'nobody', label: 'Nobody', desc: 'No one can message you' },
                  ].map(opt => {
                    const current = (currentUser.message_settings?.allowMessagesFrom) || 'communities';
                    const isSelected = current === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={async () => {
                          const updated = { ...(currentUser.message_settings || {}), allowMessagesFrom: opt.value };
                          await base44.auth.updateMe({ message_settings: updated });
                          loadUser();
                          toast.success('Messaging preference updated');
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`} />
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{opt.label}</p>
                            <p className="text-xs text-slate-400">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Show my profile in search</p>
                  <p className="text-xs text-slate-400">Allow others to find you by searching</p>
                </div>
                <Switch
                  checked={currentUser.message_settings?.searchable !== false}
                  onCheckedChange={async (val) => {
                    const updated = { ...(currentUser.message_settings || {}), searchable: val };
                    await base44.auth.updateMe({ message_settings: updated });
                    loadUser();
                    toast.success(val ? 'Profile visible in search' : 'Profile hidden from search');
                  }}
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Your Information</h3>
                <p className="text-sm text-slate-500">
                  Your age range ({currentUser.age_range || '18+'}) is visible on your profile and messages for safety purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Data & Privacy</h3>
                <p className="text-sm text-slate-500">
                  Your data is stored securely. Contact support for data requests.
                </p>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-slate-900 mb-2">Admin Tools</h3>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await base44.functions.invoke('seedLaunchContent');
                        toast.success('Seeded 40 items successfully!');
                      } catch (error) {
                        toast.error('Failed to seed content');
                      }
                      setIsSaving(false);
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🌱 Seed Launch Content'}
                  </Button>
                </div>
              )}

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

            <div className="mt-6 space-y-3">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>

              <Button
                variant="outline"
                onClick={() => { setDeleteInput(''); setShowDeleteDialog(true); }}
                disabled={isSaving}
                className="w-full text-red-700 border-red-300 hover:bg-red-50 gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will <strong>permanently delete</strong> your account, all your posts, messages, and community history. This cannot be undone.</p>
              <p className="text-slate-700 font-medium">Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-700">DELETE</span> to confirm:</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 mt-1"
                autoComplete="off"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteInput !== 'DELETE'}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              Permanently Delete
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}