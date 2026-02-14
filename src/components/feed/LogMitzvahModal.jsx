import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CATEGORIES = ['Chesed', 'Torah Study', 'Prayer', 'Tzedakah', 'Kindness', 'Other'];

export default function LogMitzvahModal({ open, onOpenChange, onSubmit }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    await onSubmit({ description, category: category || 'Other' });
    setLoading(false);
    setDescription('');
    setCategory('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Mitzvah ✨</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              What mitzvah did you do?
            </label>
            <Textarea
              placeholder="e.g., Helped neighbor carry groceries, Called someone to check in..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Category (optional)
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!description.trim() || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              'Log Mitzvah'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}