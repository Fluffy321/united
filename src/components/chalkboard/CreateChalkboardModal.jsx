import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { addDays } from 'date-fns';

const boards = [
  { value: 'help_needed', label: '🆘 Help Needed', allowAnonymous: true },
  { value: 'events', label: '📅 Events', showEventFields: true },
  { value: 'dating', label: '💕 Dating', ageRestricted: true },
  { value: 'jobs', label: '💼 Jobs & Opportunities' },
  { value: 'roommates', label: '🏠 Roommates & Housing' },
  { value: 'kosher_food', label: '🍽️ Kosher Food & Places' }
];

export default function CreateChalkboardModal({ open, onOpenChange, currentUser, onPostCreated, defaultBoard }) {
  const [boardType, setBoardType] = useState(defaultBoard || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBoard = boards.find(b => b.value === boardType);
  const isUnder18 = currentUser?.age_range === '13-17';

  const filteredBoards = boards.filter(b => {
    if (b.ageRestricted && isUnder18) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!boardType || !title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    
    await base44.entities.ChalkboardPost.create({
      board_type: boardType,
      title: title.trim(),
      content: content.trim(),
      author_name: isAnonymous ? 'Anonymous' : (currentUser.display_name || currentUser.full_name?.split(' ')[0]),
      author_id: currentUser.id,
      author_age_range: currentUser.age_range || '18+',
      is_anonymous: isAnonymous,
      city: currentUser.city || 'Five Towns',
      location_details: locationDetails.trim(),
      expires_at: addDays(new Date(), 14).toISOString(),
      event_date: eventDate || null,
      event_time: eventTime || null
    });

    setBoardType(defaultBoard || '');
    setTitle('');
    setContent('');
    setLocationDetails('');
    setIsAnonymous(false);
    setEventDate('');
    setEventTime('');
    setIsSubmitting(false);
    onOpenChange(false);
    onPostCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Post to Chalkboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Board Type</Label>
            <Select value={boardType} onValueChange={setBoardType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {filteredBoards.map(board => (
                  <SelectItem key={board.value} value={board.value}>
                    {board.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title</Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief, descriptive title"
              className="mt-1"
              maxLength={100}
            />
          </div>

          <div>
            <Label>Details</Label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details..."
              className="mt-1 min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label>Location (optional)</Label>
            <Input 
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="e.g., Cedarhurst, Lawrence"
              className="mt-1"
            />
          </div>

          {selectedBoard?.showEventFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Date</Label>
                <Input 
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Event Time</Label>
                <Input 
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {selectedBoard?.allowAnonymous && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">Post anonymously</p>
                <p className="text-sm text-slate-500">Your name won't be shown (moderators can still see)</p>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!boardType || !title.trim() || !content.trim() || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}