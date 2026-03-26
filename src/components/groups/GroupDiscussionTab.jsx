import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, MessageCircle, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function GroupDiscussionTab({ group, currentUser, isMember }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState({ title: '', body: '' });
  const [creating, setCreating] = useState(false);
  const [expandedDiscussion, setExpandedDiscussion] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadDiscussions();
  }, [group.id]);

  const loadDiscussions = async () => {
    setLoading(true);
    const topics = await base44.entities.GroupDiscussion.filter({ group_id: group.id }, '-created_date', 50);
    setDiscussions(topics);
    setLoading(false);
  };

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.body.trim()) return;
    setCreating(true);
    const topic = await base44.entities.GroupDiscussion.create({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      title: newTopic.title.trim(),
      body: newTopic.body.trim(),
      likes_count: 0,
      comments_count: 0,
    });
    setDiscussions(prev => [topic, ...prev]);
    setNewTopic({ title: '', body: '' });
    setCreating(false);
    toast.success('Discussion started!');
  };

  const handleLike = async (topic) => {
    const hasLiked = await base44.entities.DiscussionLike.filter({ discussion_id: topic.id, user_id: currentUser.id });
    if (hasLiked.length > 0) {
      await base44.entities.DiscussionLike.delete(hasLiked[0].id);
      await base44.entities.GroupDiscussion.update(topic.id, { likes_count: Math.max(0, (topic.likes_count || 0) - 1) });
      setDiscussions(prev => prev.map(t => t.id === topic.id ? { ...t, likes_count: t.likes_count - 1 } : t));
    } else {
      await base44.entities.DiscussionLike.create({ discussion_id: topic.id, user_id: currentUser.id });
      await base44.entities.GroupDiscussion.update(topic.id, { likes_count: (topic.likes_count || 0) + 1 });
      setDiscussions(prev => prev.map(t => t.id === topic.id ? { ...t, likes_count: t.likes_count + 1 } : t));
    }
  };

  const handleExpand = async (topic) => {
    if (expandedDiscussion?.id === topic.id) {
      setExpandedDiscussion(null);
      return;
    }
    setExpandedDiscussion(topic);
    const topicComments = await base44.entities.DiscussionComment.filter({ discussion_id: topic.id }, 'created_date', 50);
    setComments(prev => ({ ...prev, [topic.id]: topicComments }));
  };

  const handleAddComment = async (topic) => {
    if (!newComment.trim()) return;
    const comment = await base44.entities.DiscussionComment.create({
      discussion_id: topic.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body: newComment.trim(),
    });
    setComments(prev => ({ ...prev, [topic.id]: [...(prev[topic.id] || []), comment] }));
    await base44.entities.GroupDiscussion.update(topic.id, { comments_count: (topic.comments_count || 0) + 1 });
    setDiscussions(prev => prev.map(t => t.id === topic.id ? { ...t, comments_count: t.comments_count + 1 } : t));
    setNewComment('');
    toast.success('Comment added!');
  };

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-[15px] font-bold text-slate-700 mb-2">Members Only</p>
        <p className="text-[13px] text-slate-500 max-w-sm">Join this community to access discussions and connect with other members.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Create New Topic */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Start a Discussion</h3>
        <input
          value={newTopic.title}
          onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Topic title..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] mb-2"
        />
        <textarea
          value={newTopic.body}
          onChange={(e) => setNewTopic(prev => ({ ...prev, body: e.target.value }))}
          placeholder="What would you like to discuss?"
          rows={3}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] resize-none mb-3"
        />
        <button
          onClick={handleCreateTopic}
          disabled={creating || !newTopic.title.trim() || !newTopic.body.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-[13px] disabled:opacity-50 transition-all active:scale-95"
          style={{ background: '#2563EB' }}
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post Discussion
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-[14px] font-semibold text-slate-700">No discussions yet</p>
          <p className="text-[12px] text-slate-400 mt-1">Start the first conversation!</p>
        </div>
      ) : (
        discussions.map(topic => (
          <div key={topic.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Topic Header */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-bold text-blue-600 flex-shrink-0">
                  {topic.user_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-slate-900 mb-1">{topic.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                    <span className="font-medium text-slate-600">{topic.user_name}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(parseISO(topic.created_date), { addSuffix: true })}</span>
                  </div>
                  <p className="text-[14px] text-slate-700 leading-relaxed mb-3">{topic.body}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(topic)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                    >
                      <ChevronUp className={`w-4 h-4 ${topic.likes_count > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={topic.likes_count > 0 ? 'text-blue-600' : 'text-slate-500'}>{topic.likes_count || 0}</span>
                    </button>
                    <button
                      onClick={() => handleExpand(topic)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {topic.comments_count || 0} comments
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Comments */}
            {expandedDiscussion?.id === topic.id && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <div className="space-y-2 mb-3">
                  {(comments[topic.id] || []).length === 0 ? (
                    <p className="text-[12px] text-slate-400 text-center py-2">No comments yet</p>
                  ) : (
                    (comments[topic.id] || []).map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 flex-shrink-0">
                          {comment.user_name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-semibold text-slate-700">{comment.user_name}</span>
                            <span className="text-[10px] text-slate-400">{formatDistanceToNow(parseISO(comment.created_date), { addSuffix: true })}</span>
                          </div>
                          <p className="text-[13px] text-slate-600 leading-relaxed">{comment.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-[#2563EB]"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(topic)}
                  />
                  <button
                    onClick={() => handleAddComment(topic)}
                    disabled={!newComment.trim()}
                    className="px-3 py-2 rounded-lg text-white disabled:opacity-50"
                    style={{ background: '#2563EB' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}