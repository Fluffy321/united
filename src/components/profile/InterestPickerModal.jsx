import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech",
  "Food", "Travel", "Volunteering", "Fashion", "Gaming",
  "Fitness", "Reading", "Photography", "Movies", "Outdoors"
];

export default function InterestPickerModal({ open, onOpenChange, currentUser, onInterestAdded }) {
  const [selected, setSelected] = useState(currentUser?.interests || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (interest) => {
    setSelected(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({ interests: selected });
      toast.success('Interests updated!');
      onOpenChange(false);
      onInterestAdded();
    } catch (error) {
      toast.error('Failed to update interests');
    }
    setIsSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Select Your Interests</h2>
          <button onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">Pick up to 5 interests</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {INTERESTS.map(interest => (
            <button
              key={interest}
              onClick={() => handleToggle(interest)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selected.includes(interest)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}