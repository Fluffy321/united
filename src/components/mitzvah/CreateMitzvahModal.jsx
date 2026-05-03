import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = ['Errand', 'Lost & Found', 'Quick Favor', 'Tutoring', 'Shabbat Help', 'Other'];

export default function CreateMitzvahModal({ open, onOpenChange, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    if (open && currentUser?.id) {
      base44.entities.UserCommunity.filter({ user_id: currentUser.id }).then(memberships => {
        const communityIds = memberships.map(m => m.community_id);
        Promise.all(communityIds.map(id => base44.entities.Community.filter({ id }))).then(results => {
          const communities = results.filter(r => r.length > 0).map(r => r[0]);
          setUserCommunities(communities);
        });
      });
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
        locationLabel: locationLabel || currentUser.cityPreset || currentUser.cityCustom || 'Five Towns'
      };

      // Add user's location if available
      if (currentUser.location_lat && currentUser.location_lng) {
        requestData.approxLat = currentUser.location_lat;
        requestData.approxLng = currentUser.location_lng;
      }

      const newRequest = await base44.entities.MitzvahRequest.create(requestData);

      // Instant community-wide notification
      try {
        await base44.functions.invoke('notifyNewHelpRequest', { requestId: newRequest.id });
      } catch (e) { console.warn('notify failed', e); }

      // Also notify nearby users if location available
      if (requestData.approxLat && requestData.approxLng) {
        try {
          await base44.functions.invoke('notifyNearbyUsers', {
            requestId: newRequest.id,
            requestTitle: title.trim(),
            locationLabel: requestData.locationLabel,
            lat: requestData.approxLat,
            lng: requestData.approxLng
          });
        } catch (e) { console.warn('nearby notify failed', e); }
      }

      toast.success('Mitzvah request posted! Community notified instantly ✅');
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setLocationLabel('');
      setCommunityId('');
      setIsAnonymous(false);
    } catch (error) {
      toast.error('Failed to post request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <p className="text-xs text-slate-500 mt-1">Request will be visible to members of this community</p>
          </div>

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