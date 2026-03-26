import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import FileUploadZone from '@/components/common/FileUploadZone';
import { format } from 'date-fns';

export default function LogNewMitzvahModal({ open, onOpenChange, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hoursCompleted, setHoursCompleted] = useState('');
  const [community, setCommunity] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, hoursCompleted, community, date, photo_url: photoUrl });
      setTitle('');
      setDescription('');
      setHoursCompleted('');
      setCommunity('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setPhotoUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (files) => {
    if (files.length > 0) {
      setPhotoUrl(files[0].url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Mitzvah</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">Mitzvah Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Tutored student in algebra"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about what you did..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="hours" className="text-sm font-semibold">Hours Completed</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g., 2"
              value={hoursCompleted}
              onChange={(e) => setHoursCompleted(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="community" className="text-sm font-semibold">Community (optional)</Label>
            <Input
              id="community"
              placeholder="Which community was this for?"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-semibold">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Add Photo (optional)</Label>
            <div className="mt-1">
              <FileUploadZone
                onFilesUpload={handlePhotoUpload}
                maxFiles={1}
                acceptedTypes={['image/*']}
              />
            </div>
            {photoUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                <img src={photoUrl} alt="Mitzvah" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Logging...' : 'Log Mitzvah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}