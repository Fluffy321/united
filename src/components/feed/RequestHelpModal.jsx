import React, { useState } from 'react';
import { Loader2, Check, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUploadZone from '@/components/common/FileUploadZone';
import postsService from '@/services/postsService';
import { toast } from 'sonner';

export const HELP_REQUEST_CATEGORIES = [
  { value: 'advice',         label: 'Advice / Guidance', emoji: '💡', bgColor: '#E8F1FF', textColor: '#1E40AF', selectedBg: '#BFDBFE' },
  { value: 'lonely',         label: 'Support / Check-in', emoji: '🤝', bgColor: '#F1E6FF', textColor: '#7C3AED', selectedBg: '#DDD6FE' },
  { value: 'recommendation', label: 'Local Recommendation', emoji: '📍', bgColor: '#E6F7FF', textColor: '#0369A1', selectedBg: '#BAE6FD' },
  { value: 'antisemitism',   label: 'Safety / Hate Incident', emoji: '🛡️', bgColor: '#FFE3E3', textColor: '#991B1B', selectedBg: '#FECACA' },
  { value: 'school',         label: 'School Help', emoji: '📚', bgColor: '#FFF6D6', textColor: '#B45309', selectedBg: '#FDE68A' },
  { value: 'jobs',           label: 'Jobs / Networking', emoji: '💼', bgColor: '#E6F7EC', textColor: '#15803D', selectedBg: '#BBF7D0' },
  { value: 'family',         label: 'Family / Home', emoji: '🏠', bgColor: '#FFEBD6', textColor: '#C2410C', selectedBg: '#FED7AA' },
  { value: 'shopping',       label: 'Shopping',       emoji: '🛒', bgColor: '#E8F5E9', textColor: '#2E7D32', selectedBg: '#A5D6A7' },
  { value: 'transportation', label: 'Transportation',  emoji: '🚗', bgColor: '#E3F2FD', textColor: '#1565C0', selectedBg: '#90CAF9' },
  { value: 'tech_support',   label: 'Tech Support',    emoji: '💻', bgColor: '#F3E5F5', textColor: '#6A1B9A', selectedBg: '#CE93D8' },
  { value: 'meal',           label: 'Meal / Food',     emoji: '🍲', bgColor: '#FFF3E0', textColor: '#E65100', selectedBg: '#FFCC80' },
  { value: 'childcare',      label: 'Childcare',       emoji: '👶', bgColor: '#FCE4EC', textColor: '#880E4F', selectedBg: '#F48FB1' },
  { value: 'moving',         label: 'Moving / Heavy',  emoji: '📦', bgColor: '#FFF8E1', textColor: '#F57F17', selectedBg: '#FFE082' },
  { value: 'medical',        label: 'Medical Errand',  emoji: '💊', bgColor: '#E8EAF6', textColor: '#283593', selectedBg: '#9FA8DA' },
  { value: 'tutoring',       label: 'Tutoring',        emoji: '📚', bgColor: '#E0F7FA', textColor: '#006064', selectedBg: '#80DEEA' },
  { value: 'shabbat',        label: 'Shabbat Help',    emoji: '🕯️', bgColor: '#FFFDE7', textColor: '#F9A825', selectedBg: '#FFF176' },
  { value: 'other',          label: 'Other',            emoji: '🙏', bgColor: '#F5F5F5', textColor: '#424242', selectedBg: '#E0E0E0' },
];

export default function RequestHelpModal({ open, onOpenChange, currentUser }) {
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const selectedCat = HELP_REQUEST_CATEGORIES.find(c => c.value === category);

  const handleSubmit = async () => {
    if (!body.trim()) { toast.error('Please describe what you need'); return; }
    if (!category) { toast.error('Please select a category'); return; }

    setIsSubmitting(true);
    await postsService.createMitzvahRequestPost({
      user_id: currentUser.id,
      user_name: isAnonymous ? 'Anonymous' : (currentUser.display_name || currentUser.full_name),
      user_age_range: currentUser.age_range,
      type: 'help',
      board: 'help',
      body: body.trim(),
      category,
      location_text: location.trim() || undefined,
      is_anonymous: isAnonymous,
      city: currentUser.city || 'Five Towns',
      image_url: attachedFiles[0]?.url || undefined,
      attachment_urls: attachedFiles.map(f => f.url),
      help_status: 'open',
      request_kind: category,
    });

    toast.success('Help request posted!');
    setBody(''); setCategory(''); setLocation(''); setIsAnonymous(false); setAttachedFiles([]);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold">🙋 Request Help</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Category picker */}
          <div>
            <Label className="mb-2 block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
              What kind of help do you need?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {HELP_REQUEST_CATEGORIES.map(cat => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className="relative rounded-xl p-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    style={{
                      backgroundColor: isSelected ? cat.selectedBg : cat.bgColor,
                      color: cat.textColor,
                      boxShadow: isSelected ? `0 0 0 2px ${cat.textColor}55` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="font-semibold text-sm">{cat.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1 block">Describe what you need</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Give a bit more detail so someone can help you..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <Label className="mb-1 block">Location <span className="text-slate-400 font-normal">(optional)</span></Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cedarhurst, Five Towns"
                className="pl-9"
              />
            </div>
          </div>

          {/* File upload */}
          <div>
            <Label className="mb-2 block">Attachments <span className="text-slate-400 font-normal">(optional)</span></Label>
            <FileUploadZone 
              onFilesUpload={setAttachedFiles}
              maxFiles={3}
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
            <div>
              <p className="text-sm font-medium">Post anonymously</p>
              <p className="text-xs text-slate-500">Your name will be hidden</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>

        {/* Preview badge */}
        {selectedCat && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-lg">{selectedCat.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: selectedCat.textColor }}>{selectedCat.label}</span>
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">OPEN</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
