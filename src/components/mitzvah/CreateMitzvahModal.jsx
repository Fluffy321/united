import React, { useState, useEffect } from 'react';
import { Loader2, Globe, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { dataService } from '@/services';
import { toast } from 'sonner';
import { COMMUNITIES_ENABLED } from '@/config/features';

const CATEGORIES = ['Ride', 'Errand', 'Lost & Found', 'Quick Favor', 'Tutoring', 'Shabbat Help', 'Other'];

const VISIBILITY_OPTIONS = [
  {
    value: 'community',
    label: 'JUnited Feed',
    description: 'Visible in the main beta feed and Mitzvah Circle.',
    icon: Globe,
  },
  {
    value: 'friends_only',
    label: 'Friends Only',
    description: 'Only friends you have connected with can see this request.',
    icon: Users,
  },
];

export default function CreateMitzvahModal({ open, onOpenChange, currentUser, initialValues = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState('community');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title || '');
    setDescription(initialValues?.description || '');
    setCategory(initialValues?.category || '');
    setLocationLabel(initialValues?.locationLabel || '');
    setVisibility(initialValues?.visibility || 'community');
  }, [open, initialValues]);

  useEffect(() => {
    if (open && currentUser?.id && COMMUNITIES_ENABLED) {
      dataService.entities.UserCommunity.filter({ user_id: currentUser.id }).then(memberships => {
        const communityIds = memberships.map(m => m.community_id);
        Promise.all(communityIds.map(id => dataService.entities.Community.filter({ id }))).then(results => {
          const communities = results.filter(r => r.length > 0).map(r => r[0]);
          setUserCommunities(communities);
        });
      });
    } else if (open && !COMMUNITIES_ENABLED) {
      setCommunityId('');
      setUserCommunities([]);
    }
  }, [open, currentUser?.id]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCommunity = userCommunities.find(c => c.id === communityId);
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        category,
        status: 'open',
        created_by_user_id: currentUser.id,
        created_by_name: isAnonymous ? 'Anonymous' : currentUser.display_name,
        is_anonymous: isAnonymous,
        community_id: communityId || null,
        community_name: selectedCommunity?.name || null,
        visibility,
        locationLabel: locationLabel || currentUser.cityPreset || currentUser.cityCustom || 'Five Towns',
      };

      if (currentUser.location_lat && currentUser.location_lng) {
        requestData.approxLat = currentUser.location_lat;
        requestData.approxLng = currentUser.location_lng;
      }

      const newRequest = await dataService.entities.MitzvahRequest.create(requestData);

      if (visibility === 'community') {
        try {
          await dataService.functions.invoke('notifyNewHelpRequest', { requestId: newRequest.id });
        } catch (e) { console.warn('notify failed', e); }

        if (requestData.approxLat && requestData.approxLng) {
          try {
            await dataService.functions.invoke('notifyNearbyUsers', {
              requestId: newRequest.id,
              requestTitle: title.trim(),
              locationLabel: requestData.locationLabel,
              lat: requestData.approxLat,
              lng: requestData.approxLng,
            });
          } catch (e) { console.warn('nearby notify failed', e); }
        }
      }

      const successMsg = visibility === 'friends_only'
        ? 'Mitzvah request posted! Visible to your friends only.'
        : 'Mitzvah request posted! Community notified instantly ✅';
      toast.success(successMsg);
      onOpenChange(false);

      setTitle('');
      setDescription('');
      setCategory('');
      setLocationLabel('');
      setCommunityId('');
      setIsAnonymous(false);
      setVisibility('community');
    } catch (error) {
      toast.error('Failed to post request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a Mitzvah Request</DialogTitle>
          <DialogDescription>
            Ask the community for help with something small
          </DialogDescription>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-blue-900">
              <strong>Privacy:</strong> Don't post exact addresses publicly. Share precise details only after someone accepts.
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>What do you need help with?</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Need a ride to shul tomorrow"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Details</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more information..."
              className="mt-1 min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility selector */}
          <div>
            <Label>Who can see this?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {VISIBILITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = visibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[13px] font-black">{opt.label}</span>
                    </div>
                    <p className={`text-[11px] leading-tight ${selected ? 'text-white/75' : 'text-slate-400'}`}>
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {COMMUNITIES_ENABLED && (
            <div>
              <Label>Post to Community (optional)</Label>
              <Select value={communityId} onValueChange={setCommunityId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {userCommunities.map(community => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {visibility === 'friends_only'
                  ? 'Friends-only requests are visible to friends regardless of community.'
                  : 'Request will be visible to members of this community'}
              </p>
            </div>
          )}

          <div>
            <Label>Approximate Location</Label>
            <Input
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder={currentUser.cityPreset || currentUser.cityCustom || "e.g., Cedarhurst"}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">General area only (e.g., neighborhood name)</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Post anonymously</Label>
              <p className="text-xs text-slate-500">Your identity will be hidden</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
