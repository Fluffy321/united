import React, { useState } from 'react';
import { X, Image, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';

const INTERESTS = [
  "Torah & Learning", "Sports", "Music", "Art", "Tech", 
  "Food", "Travel", "Volunteering", "Fashion", "Gaming"
];

export default function CreatePostModal({ open, onOpenChange, currentUser, prompt, onPostCreated }) {
  const [content, setContent] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    let imageUrl = null;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }

    await base44.entities.Post.create({
      content: content.trim(),
      image_url: imageUrl,
      author_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
      author_id: currentUser.id,
      author_age_range: currentUser.age_range || '18+',
      city: currentUser.city || 'Five Towns',
      interests: selectedInterests,
      is_prompt_response: !!prompt,
      prompt_text: prompt?.prompt_text
    });

    setContent('');
    setSelectedInterests([]);
    setImageFile(null);
    setImagePreview(null);
    setIsSubmitting(false);
    onOpenChange(false);
    onPostCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Post</DialogTitle>
        </DialogHeader>

        {prompt && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-4 py-3 border border-indigo-100">
            <p className="text-sm text-indigo-700 font-medium">💭 {prompt.prompt_text}</p>
          </div>
        )}

        <Textarea 
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] resize-none border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
        />

        {imagePreview && (
          <div className="relative">
            <img src={imagePreview} alt="" className="rounded-xl max-h-48 object-cover w-full" />
            <Button 
              size="icon" 
              variant="secondary"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div>
          <p className="text-sm text-slate-600 mb-2">Add topics (optional)</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <Badge 
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedInterests.includes(interest) 
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

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <input 
              type="file" 
              accept="image/*" 
              id="post-image" 
              className="hidden" 
              onChange={handleImageSelect}
            />
            <label htmlFor="post-image">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600" asChild>
                <span><Image className="w-5 h-5" /> Add Photo</span>
              </Button>
            </label>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!content.trim() || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 px-6"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}