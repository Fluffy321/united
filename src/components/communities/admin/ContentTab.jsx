import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Megaphone, Loader2, Send, Pin } from 'lucide-react';
import postsService from '@/services/postsService';
import { EmptyState, SectionHeader, fmtRelative } from './shared';

// ─── Content tab (pinned post) ────────────────────────────────────────────────

export default function ContentTab({ communityId, currentUser }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [pinAnnouncement, setPinAnnouncement] = useState(true);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const { data: pinnedPost = null } = useQuery({
    queryKey: ['community-pinned-post', communityId],
    queryFn: async () => {
      const rows = await postsService.filterPosts({ community_id: communityId, is_pinned: true }, '-pinned_at', 1);
      return rows[0] ?? null;
    },
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['community-content-posts', communityId],
    queryFn: async () => {
      return postsService.filterPosts({ community_id: communityId, is_pinned: false }, '-created_date', 20);
    },
    enabled: pickerOpen,
  });

  const invalidatePins = () => {
    queryClient.invalidateQueries({ queryKey: ['community-pinned-post', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-content-posts', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-hub-posts', communityId] });
  };

  const handleCreateAnnouncement = async () => {
    const body = announcementBody.trim();
    const title = announcementTitle.trim();
    if (!body) {
      toast.error('Add announcement text first.');
      return;
    }
    setCreatingAnnouncement(true);
    try {
      if (pinAnnouncement && pinnedPost) {
        await postsService.updatePost(pinnedPost.id, { is_pinned: false });
      }
      await postsService.createCommunityPost({
        community_id: communityId,
        user_id: currentUser?.id,
        author_user_id: currentUser?.id,
        author_name: currentUser?.display_name || currentUser?.full_name || 'Community admin',
        title: title || (body.length > 72 ? body.slice(0, 72) : 'Community announcement'),
        body,
        content: body,
        type: 'announcement',
        post_type: 'announcement',
        post_kind: 'announcement',
        is_official: true,
        is_pinned: pinAnnouncement,
      });
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setPinAnnouncement(true);
      invalidatePins();
      toast.success(pinAnnouncement ? 'Announcement posted and featured' : 'Announcement posted');
    } catch (err) {
      toast.error(err?.message || 'Could not create announcement');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handlePin = async (postId) => {
    setPinning(true);
    try {
      if (pinnedPost) {
        await postsService.updatePost(pinnedPost.id, { is_pinned: false });
      }
      await postsService.updatePost(postId, { is_pinned: true });
      invalidatePins();
      toast.success('Post pinned');
      setPickerOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not pin post');
    } finally {
      setPinning(false);
    }
  };

  const handleUnpin = async () => {
    if (!pinnedPost) return;
    setPinning(true);
    try {
      await postsService.updatePost(pinnedPost.id, { is_pinned: false });
      invalidatePins();
      toast.success('Post unpinned');
    } catch (err) {
      toast.error(err?.message || 'Could not unpin post');
    } finally {
      setPinning(false);
    }
  };

  const postSnippet = (post) => {
    const text = post.title || post.content || '';
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <div>
        <SectionHeader title="Official announcement" />
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">Create an official update</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                Announcements are labeled as official community updates and appear in the community experience.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
              placeholder="Optional headline"
              className="h-11 w-full rounded-2xl border border-amber-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-amber-300"
            />
            <textarea
              value={announcementBody}
              onChange={(event) => setAnnouncementBody(event.target.value)}
              rows={4}
              placeholder="Write the update members should see..."
              className="w-full resize-none rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-amber-300"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={pinAnnouncement}
                  onChange={(event) => setPinAnnouncement(event.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                Feature this announcement
              </label>
              <button
                type="button"
                onClick={handleCreateAnnouncement}
                disabled={creatingAnnouncement || !announcementBody.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"
              >
                {creatingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {creatingAnnouncement ? 'Posting...' : 'Post announcement'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Featured post" />
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          {pinnedPost ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Pin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 line-clamp-2">{postSnippet(pinnedPost)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(pinnedPost.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-[13px] font-black text-slate-700 hover:bg-slate-50"
                >
                  Change pin
                </button>
                <button
                  type="button"
                  onClick={handleUnpin}
                  disabled={pinning}
                  className="h-9 px-4 rounded-xl bg-slate-100 text-[13px] font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Unpin
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Pin className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-[13px] font-bold text-slate-500">No post pinned</p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="h-9 px-5 rounded-xl bg-blue-600 text-white text-[13px] font-black"
              >
                Pin a post
              </button>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="space-y-3">
          <SectionHeader
            title="Select a post to pin"
            action={
              <button type="button" onClick={() => setPickerOpen(false)} className="text-[12px] font-bold text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            }
          />
          {recentPosts.length === 0 ? (
            <EmptyState icon={Pin} title="No posts yet" body="Post something in the community first." />
          ) : (
            <div className="space-y-2">
              {recentPosts.map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handlePin(post.id)}
                  disabled={pinning}
                  className="w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 hover:border-blue-300 transition-colors disabled:opacity-50"
                >
                  <p className="text-[13px] font-semibold text-slate-800 line-clamp-2">{postSnippet(post)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(post.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Featured posts appear in the community welcome area for all members. Use this for one important announcement, post, event reminder, or start-here update.
        </p>
      </div>
    </div>
  );
}
