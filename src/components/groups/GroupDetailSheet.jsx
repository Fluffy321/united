import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Users, MapPin, Send } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function GroupDetailSheet({ group, open, onOpenChange, currentUser, isMember, onJoin, onLeave }) {
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState('posts');

  useEffect(() => {
    if (open && group) {
      base44.entities.GroupPost.filter({ group_id: group.id }, '-created_date', 30).then(setPosts);
      base44.entities.GroupMember.filter({ group_id: group.id }, '-created_date', 50).then(setMembers);
    }
  }, [open, group]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    const post = await base44.entities.GroupPost.create({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body: newPost.trim()
    });
    await base44.entities.CommunityGroup.update(group.id, { post_count: (group.post_count || 0) + 1 });
    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setPosting(false);
    toast.success('Posted!');
  };

  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 flex flex-col">
        {/* Header */}
        <div
          className="h-28 flex flex-col justify-end p-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent), #1d4ed8)' }}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 text-white/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-[20px]">{group.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-white/70 text-[12px]">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count || 0} members</span>
            {group.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {group.location}</span>}
          </div>
        </div>

        {/* Join/Leave */}
        <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[13px] text-[#64748b] flex-1 mr-3">{group.description}</p>
          <button
            onClick={() => isMember ? onLeave(group) : onJoin(group)}
            className="flex-shrink-0 px-4 py-2 rounded-full font-bold text-[13px] transition-all active:scale-95"
            style={isMember
              ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
              : { background: 'var(--primary)', color: 'white' }
            }
          >
            {isMember ? '✓ Joined' : '+ Join'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {['posts', 'members'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-[13px] font-semibold capitalize transition-colors"
              style={tab === t
                ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                : { color: '#94a3b8' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'posts' ? (
            <div className="p-4 space-y-3">
              {isMember && (
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 border border-[#e2e8f0] rounded-xl px-3 py-2 text-[13px] resize-none outline-none focus:border-[#2563eb]"
                    rows={2}
                    placeholder="Share something with the group…"
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                  />
                  <button
                    onClick={handlePost}
                    disabled={posting || !newPost.trim()}
                    className="self-end px-3 py-2 rounded-xl text-white transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
              {posts.length === 0 ? (
                <div className="text-center py-10 text-[#94a3b8] text-[13px]">No posts yet. Be the first!</div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl p-3.5" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[11px] font-bold text-[#374151]">
                        {post.user_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-[13px] text-[#0F1C2E]">{post.user_name}</p>
                        <p className="text-[10px] text-[#94a3b8]">{formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#374151] leading-snug">{post.body}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[12px] font-bold text-[#374151]">
                    {m.user_name?.[0] || '?'}
                  </div>
                  <p className="text-[14px] font-medium text-[#0F1C2E]">{m.user_name}</p>
                  {m.role === 'admin' && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb]">Admin</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}