import React, { useState } from 'react';
import { Loader2, Camera, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CitySelector from '@/components/common/CitySelector';

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech", 
  "Food", "Travel", "Volunteering", "Fashion", "Gaming",
  "Fitness", "Reading", "Photography", "Movies", "Outdoors"
];

export default function ProfileSetup({ user, onComplete }) {
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name?.split(' ')[0] || '');
  const [birthYear, setBirthYear] = useState(user?.birth_year || '');
  const [cityPreset, setCityPreset] = useState(user?.cityPreset || 'Lawrence');
  const [cityCustom, setCityCustom] = useState(user?.cityCustom || '');
  const [cityState, setCityState] = useState(user?.cityState || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(user?.avatar_url ? 2 : 1);

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 13;

  const calculateAgeRange = (year) => {
    const age = currentYear - year;
    return age >= 18 ? '18+' : '13-17';
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

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleContinueToDetails = async () => {
    if (!avatarFile && !avatarPreview) {
      toast.error('Please upload a profile photo to continue');
      return;
    }

    // Upload avatar if new file selected
    if (avatarFile) {
      setIsSubmitting(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
        await base44.auth.updateMe({ avatar_url: file_url });
        setAvatarPreview(file_url);
        setIsSubmitting(false);
        setStep(2);
      } catch (error) {
        toast.error('Failed to upload photo');
        setIsSubmitting(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || !birthYear || !avatarPreview) return;
    
    setIsSubmitting(true);

    try {
      await base44.auth.updateMe({
        display_name: displayName.trim(),
        birth_year: parseInt(birthYear),
        age_range: calculateAgeRange(parseInt(birthYear)),
        cityPreset,
        cityCustom,
        cityState,
        bio: bio.trim(),
        interests,
        is_profile_complete: true,
        followed_boards: ['help_needed', 'events', 'kosher_food']
      });

      // Auto-join default community groups
      const AUTO_JOIN_GROUPS = ['Five Towns Alerts', 'Mitzvah Map Volunteers', 'Pickup Basketball', 'Young Adults Hangouts', 'HAFTR Community'];
      const groups = await base44.entities.CommunityGroup.list();
      const autoGroups = groups.filter(g => AUTO_JOIN_GROUPS.includes(g.name));
      await Promise.allSettled(autoGroups.map(g =>
        base44.entities.GroupMember.create({ group_id: g.id, user_id: user.id, user_name: displayName.trim(), role: 'member' })
      ));

      setIsSubmitting(false);
      onComplete?.();
    } catch (error) {
      toast.error('Failed to complete setup');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to United</h1>
          <p className="text-slate-500 mt-1">Let's set up your profile</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Profile Photo (Required) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Upload Your Profile Photo</h2>
                <p className="text-sm text-slate-500 mb-6">A real photo helps build trust in our community</p>
                
                <div className="flex justify-center mb-6">
                  {avatarPreview ? (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 shadow-lg">
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={removeAvatar}
                        className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full shadow-md flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="avatar-upload"
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-all border-4 border-dashed border-slate-300"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500 font-medium">Upload Photo</span>
                    </label>
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png" 
                    id="avatar-upload" 
                    className="hidden" 
                    onChange={handleAvatarChange} 
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-3 text-left">
                  <p className="text-xs text-blue-900 font-medium mb-1">📸 Photo Guidelines:</p>
                  <ul className="text-xs text-blue-800 space-y-1 ml-4">
                    <li>• Clear, recent photo of your face</li>
                    <li>• JPG or PNG format only</li>
                    <li>• Maximum file size: 5MB</li>
                  </ul>
                </div>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-6"
                onClick={handleContinueToDetails}
                disabled={(!avatarFile && !avatarPreview) || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>First Name</Label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your first name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Birth Year</Label>
                <Select value={birthYear.toString()} onValueChange={(v) => setBirthYear(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your birth year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {birthYear && (
                  <p className="text-sm text-slate-500 mt-2">
                    You'll be shown as: <Badge variant="outline">{calculateAgeRange(parseInt(birthYear))}</Badge>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setStep(3)}
                  disabled={!displayName.trim() || !birthYear}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Location & Bio */}
          {step === 3 && (
            <div className="space-y-4">
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
                <Label>Bio (optional)</Label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="mt-1 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setStep(4)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Interests (pick up to 5)</Label>
                <p className="text-sm text-slate-500 mb-3">Help us connect you with like-minded people</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <Badge 
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-all text-sm py-1.5 px-3 ${
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}