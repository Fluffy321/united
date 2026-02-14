import React, { useState } from 'react';
import { Loader2, Camera, Sparkles } from 'lucide-react';
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

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech", 
  "Food", "Travel", "Volunteering", "Fashion", "Gaming",
  "Fitness", "Reading", "Photography", "Movies", "Outdoors"
];

const CITIES = ["Five Towns", "Brooklyn", "Manhattan", "Queens", "Long Island"];

const NEIGHBORHOODS = {
  "Five Towns": ["Lawrence", "Cedarhurst", "Woodmere", "Hewlett", "Inwood"],
  "Brooklyn": ["Flatbush", "Midwood", "Boro Park", "Williamsburg", "Crown Heights"],
  "Manhattan": ["Upper West Side", "Upper East Side", "Lower East Side", "Washington Heights"],
  "Queens": ["Kew Gardens", "Forest Hills", "Jamaica Estates"],
  "Long Island": ["Great Neck", "Roslyn", "Woodbury"]
};

const getRandomPreset = () => {
  const presets = ['smile', 'heart', 'star', 'zap', 'moon', 'sun', 'music', 'coffee', 'camera', 'book', 'palette', 'rocket', 'sparkles', 'cloud', 'crown', 'flame', 'leaf', 'mountain', 'trophy', 'gift', 'umbrella', 'anchor', 'compass', 'feather', 'globe', 'key', 'target', 'puzzle', 'lightbulb'];
  return presets[Math.floor(Math.random() * presets.length)];
};

const getRandomTheme = () => {
  const themes = ['ocean-blue', 'sunset-orange', 'purple-glow', 'mint-green', 'midnight-dark', 'gold-shine', 'soft-pink', 'sky-gradient'];
  return themes[Math.floor(Math.random() * themes.length)];
};

export default function ProfileSetup({ user, onComplete }) {
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name?.split(' ')[0] || '');
  const [birthYear, setBirthYear] = useState(user?.birth_year || '');
  const [city, setCity] = useState(user?.city || 'Five Towns');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Auto-assign avatar preset and theme if not already set
  const [avatarPresetId] = useState(user?.avatar_preset_id || getRandomPreset());
  const [avatarTheme] = useState(user?.avatar_theme || getRandomTheme());

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
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || !birthYear) return;
    
    setIsSubmitting(true);

    let avatarUrl = user?.avatar_url;
    if (avatarFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
      avatarUrl = file_url;
    }

    await base44.auth.updateMe({
      display_name: displayName.trim(),
      birth_year: parseInt(birthYear),
      age_range: calculateAgeRange(parseInt(birthYear)),
      city,
      neighborhood: neighborhood.trim(),
      bio: bio.trim(),
      interests,
      avatar_url: avatarUrl,
      avatar_type: avatarUrl ? 'photo' : 'avatar',
      avatar_preset_id: avatarPresetId,
      avatar_theme: avatarTheme,
      is_profile_complete: true,
      followed_boards: ['help_needed', 'events', 'kosher_food']
    });

    setIsSubmitting(false);
    onComplete?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to United</h1>
          <p className="text-slate-500 mt-1">Let's set up your profile</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div 
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
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

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setStep(2)}
                disabled={!displayName.trim() || !birthYear}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>City</Label>
                <Select value={city} onValueChange={(v) => { setCity(v); setNeighborhood(''); }}>
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
                <Label>Neighborhood</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEIGHBORHOODS[city]?.map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
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
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
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