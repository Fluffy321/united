import React, { useState, useRef } from 'react';
import { Loader2, Plus, Sparkles, Bell, Pin, BarChart2, Users, FileText, Upload, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CommunityLogo from './CommunityLogo';

const PREMIUM_FEATURES = [
  { icon: Bell, label: 'Push Notifications', desc: 'Notify all followers instantly' },
  { icon: Pin, label: 'Pin Announcements', desc: 'Keep important posts at the top' },
  { icon: FileText, label: 'Bulletin Uploads', desc: 'Share PDFs & flyers' },
  { icon: Users, label: 'Multi-Admin Roles', desc: 'Invite staff as editors or admins' },
  { icon: BarChart2, label: 'Analytics', desc: 'Views, follows, and engagement metrics' },
  { icon: Sparkles, label: 'Featured Placement', desc: 'Highlighted in the directory' },
];

export default function AdminToolsPanel({ community, org, currentUser, onPostCreated, onLogoUpdated }) {
  const [tab, setTab] = useState('posts');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postType, setPostType] = useState('general');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(community?.logo_url || null);
  const fileInputRef = useRef(null);

  const isPremium = org?.plan === 'PREMIUM';

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Community.update(community.id, {
        logo_url: file_url,
        logo_source: 'UPLOADED',
      });
      setLogoPreview(file_url);
      toast.success('Logo updated!');
      onLogoUpdated?.();
    } catch {
      toast.error('Upload failed');
    }
    setLogoUploading(false);
  };

  const handleCreatePost = async () => {
    if (!postBody.trim()) { toast.error('Please write something'); return; }
    setSubmitting(true);
    await base44.entities.CommunityPost.create({
      community_id: community.id,
      org_id: org?.id,
      author_user_id: currentUser.id,
      author_name: currentUser.display_name || currentUser.full_name,
      is_official: true,
      type: postType,
      title: postTitle.trim() || undefined,
      body: postBody.trim(),
      event_date: eventDate || undefined,
      event_time: eventTime || undefined,
      location_text: eventLocation.trim() || undefined,
    });
    setPostTitle(''); setPostBody(''); setPostType('general');
    setEventDate(''); setEventTime(''); setEventLocation('');
    setSubmitting(false);
    toast.success('Posted!');
    onPostCreated?.();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex border-b border-slate-100">
        {['posts', 'events', 'logo', 'premium'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-[#0F5ED7] border-b-2 border-[#0F5ED7]' : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {['general', 'announcement', 'event'].map(t => (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize ${
                    postType === t ? 'bg-[#0F5ED7] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Title (optional)" />
            <Textarea
              value={postBody}
              onChange={e => setPostBody(e.target.value)}
              placeholder="Write your announcement or update..."
              className="resize-none"
              rows={4}
            />
            {postType === 'event' && (
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                <div className="col-span-2">
                  <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location" />
                </div>
              </div>
            )}
            <Button className="w-full bg-[#0F5ED7] hover:bg-[#0D4EB8]" onClick={handleCreatePost} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Post</>}
            </Button>
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div className="space-y-3">
            <Input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Event name *" />
            <Textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="Event details..." className="resize-none" rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
            </div>
            <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location" />
            <Button
              className="w-full bg-[#0F5ED7] hover:bg-[#0D4EB8]"
              onClick={() => { setPostType('event'); handleCreatePost(); }}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
            </Button>
          </div>
        )}

        {/* Logo Tab */}
        {tab === 'logo' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CommunityLogo community={{ ...community, logo_url: logoPreview }} size="lg" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 mb-1">Community Logo</p>
                <p className="text-xs text-slate-400 mb-3">
                  {community.logo_source === 'UPLOADED' ? 'Custom uploaded logo' :
                   community.logo_source === 'AUTO' ? 'Auto-fetched from website' :
                   'No logo set'}
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="bg-[#0F5ED7] hover:bg-[#0D4EB8] text-xs"
                >
                  {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  {logoUploading ? 'Uploading…' : 'Upload Logo'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              Uploaded logos override any auto-generated ones. Recommended: square PNG or JPG, at least 200×200px.
            </p>
          </div>
        )}

        {/* Premium Tab */}
        {tab === 'premium' && (
          <div className="space-y-4">
            {isPremium ? (
              <div className="text-center py-4">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="font-bold text-slate-900">You're on Premium 🎉</p>
                <p className="text-sm text-slate-500">All features unlocked</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-[#0F5ED7] to-[#7B3FE4] rounded-2xl p-4 text-white mb-4">
                  <p className="font-bold text-lg mb-1">Upgrade to Premium</p>
                  <p className="text-sm text-blue-100 mb-3">Unlock advanced tools for your community</p>
                  <div className="text-2xl font-black">$29<span className="text-base font-normal text-blue-200">/mo</span></div>
                </div>
                <div className="space-y-2">
                  {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <Icon className="w-5 h-5 text-[#0F5ED7] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-[#0F5ED7] to-[#7B3FE4] text-white font-bold h-11 rounded-xl">
                  <Sparkles className="w-4 h-4 mr-2" />Upgrade to Premium
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}