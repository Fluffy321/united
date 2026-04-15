import React, { useState, useEffect } from 'react';
import { MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, CheckCircle2, Users, Ban, Bookmark } from 'lucide-react';
import PromptCard from './PromptCard';
import PollCard from './PollCard';
import { Button } from "@/components/ui/button";
import UserAvatar from '@/components/common/UserAvatar';
import HelperBadge from '@/components/profile/HelperBadge';
import MessageButton from '@/components/common/MessageButton';
import CommentsSheet from './CommentsSheet';
import EventRSVPSection from '@/components/events/EventRSVPSection';
import ReactionBar from './ReactionBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { HELP_REQUEST_CATEGORIES } from '@/components/feed/RequestHelpModal';

// Short-circuit for community prompts
function PromptWrapper({ post, currentUser }) {
  return <PromptCard post={post} currentUser={currentUser} />;
}

function BookmarkButton({ postId, currentUser }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Bookmark.filter({ post_id: postId, user_id: currentUser.id })
      .then(r => setBookmarked(r.length > 0))
      .catch(() => {});
  }, [postId, currentUser]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    if (loading) return;
    setLoading(true);
    if (bookmarked) {
      const existing = await base44.entities.Bookmark.filter({ post_id: postId, user_id: currentUser.id });
      if (existing[0]) await base44.entities.Bookmark.delete(existing[0].id);
      setBookmarked(false);
    } else {
      await base44.entities.Bookmark.create({ post_id: postId, user_id: currentUser.id });
      setBookmarked(true);
      toast.success('Post saved!');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
        bookmarked ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
      title={bookmarked ? 'Remove bookmark' : 'Save post'}
    >
      <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
    </button>
  );
}

// Unified badge style: blue for informational, dark-blue outlined for urgent
const BASE_BADGE = 'bg-blue-50 text-blue-700 border border-blue-200';
const URGENT_BADGE = 'bg-blue-900 text-white border border-blue-900';
const MUTED_BADGE = 'bg-slate-100 text-slate-500 border border-slate-200';

const TYPE_CONFIGS = {
  feed:         { label: 'Post',        color: MUTED_BADGE },
  help:         { label: 'Help Needed', color: URGENT_BADGE },
  event:        { label: 'Event',       color: BASE_BADGE },
  job:          { label: 'Job',         color: BASE_BADGE },
  housing:      { label: 'Housing',     color: BASE_BADGE },
  dating:       { label: 'Dating',      color: BASE_BADGE },
  food:         { label: 'Food',        color: BASE_BADGE },
  shul:         { label: 'Shul',        color: BASE_BADGE },
  news:         { label: 'News',        color: MUTED_BADGE },
  prompt_reply: { label: 'Prompt',      color: BASE_BADGE },
};

const SUBTYPE_CONFIGS = {
discussion:     { label: '💬 Discussion',     color: MUTED_BADGE },
question:       { label: '❓ Question',        color: BASE_BADGE },
alert:          { label: '🚨 Alert',           color: 'bg-red-600 text-white border border-red-600' },
  recommendation: { label: '⭐ Tip',             color: BASE_BADGE },
  lost_found:     { label: '🔍 Lost & Found',   color: BASE_BADGE },
};

const ACTION_BUTTON = {
  help: { label: 'Offer Help', icon: null },
  event: { label: 'RSVP', icon: null },
  job: { label: 'Apply', icon: null },
  housing: { label: 'Interested', icon: null },
  dating: { label: 'Connect', icon: null },
};

function InterestedButton({ post, currentUser }) {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(false);

  const handleInterested = async () => {
    try {
      // Find or create a conversation with the poster
      const convs = await base44.entities.Conversation.list('-updated_date', 50);
      let conv = convs.find(c =>
        c.participant_ids?.includes(currentUser.id) && c.participant_ids?.includes(post.user_id)
      );
      if (!conv) {
        conv = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, post.user_id],
          participant_names: [
            currentUser.display_name || currentUser.full_name?.split(' ')[0],
            post.user_name,
          ],
          participant_ages: [currentUser.age_range || '18+', '18+'],
          unread_count: {},
          request_title: post.title || post.body?.substring(0, 50),
          request_type: 'general',
        });
      }
      await base44.entities.Message.create({
        conversation_id: conv.id,
        sender_id: currentUser.id,
        sender_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
        recipient_id: post.user_id,
        content: `Hi! I'm interested in your housing post: "${post.title || post.body?.substring(0, 60)}"`,
        is_read: false,
      });
      setSent(true);
      toast.success('Message sent to the poster!');
      setTimeout(() => navigate(createPageUrl('Messages') + `?conversation=${conv.id}`), 800);
    } catch {
      toast.error('Could not send message');
    }
  };

  return (
    <button
      onClick={handleInterested}
      disabled={sent}
      className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
        sent ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {sent ? '✓ Sent' : 'Interested'}
    </button>
  );
}

export default function UnifiedPostCard({ post, currentUser, onLike, onComment, onDelete, onReport, onBlock, blockedIds = [], liked, communities, onCommunityClick, isFromJoinedCommunity = false }) {
  const [expanded, setExpanded] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [helpStatus, setHelpStatus] = useState(post.help_status || 'open');
  const [fulfilling, setFulfilling] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingRSVP, setLoadingRSVP] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [submittingQuickReply, setSubmittingQuickReply] = useState(false);
  const [recentComments, setRecentComments] = useState([]);

  // Always fetch 2 most recent comments — seeded posts may have real comments even with count=0
  useEffect(() => {
    if (!post?.id || typeof post.id !== 'string') return;
    base44.entities.Comment.filter({ post_id: post.id }, '-created_date', 2)
      .then(comments => setRecentComments(comments))
      .catch(() => {});
  }, [post?.id, commentCount]);

  if (post.type === 'prompt') return <PromptWrapper post={post} currentUser={currentUser} />;
  if (post.type === 'poll' || post.post_subtype === 'poll') return <PollCard post={post} currentUser={currentUser} />;

  const isOwner = currentUser?.id === post.user_id;
  const communityName = post.community_name || (communities && post.community_id
    ? communities.find(c => c.id === post.community_id)?.name
    : null);
  const isAnonymous = post.is_anonymous;

  const getDisplayDate = () => {
    if (post.is_seeded) {
      const hash = post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const maxMs = 4 * 24 * 60 * 60 * 1000;
      return new Date(Date.now() - (hash % maxMs));
    }
    return new Date(post.created_date);
  };

  const getTimeAgo = (date) => {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  };
  const timeAgo = getTimeAgo(getDisplayDate());
  const isVeryRecent = !post.is_seeded && (Date.now() - new Date(post.created_date).getTime()) < 10 * 60 * 1000;
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;
  const helpCat = HELP_REQUEST_CATEGORIES.find(c => c.value === post.category);

  const BODY_LIMIT = 200;
  const bodyLong = post.body && post.body.length > BODY_LIMIT;
  const bodyPreview = bodyLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body;

  const handleFulfilled = async () => {
    setFulfilling(true);
    await base44.entities.UnifiedPost.update(post.id, { help_status: 'fulfilled' });
    setHelpStatus('fulfilled');
    setFulfilling(false);
    toast.success('Marked as fulfilled! 🎉');
  };

  const handleQuickReply = async () => {
    if (!quickReplyText.trim() || !currentUser) return;
    setSubmittingQuickReply(true);
    try {
      await base44.entities.Comment.create({
        post_id: post.id,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || 'User',
        body: quickReplyText.trim(),
      });
      setCommentCount(prev => prev + 1);
      setQuickReplyText('');
      setQuickReplyOpen(false);
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Could not post reply');
    } finally {
      setSubmittingQuickReply(false);
    }
  };

  // ── Photo post ────────────────────────────────────────────────────────
  const allImages = post.image_urls?.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
  if (allImages.length > 0 && post.type === 'feed' && !post.title) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white"
      >
        {/* Image grid */}
        <div className={`overflow-hidden ${
          allImages.length === 1 ? '' :
          allImages.length === 2 ? 'grid grid-cols-2 gap-0.5' :
          'grid grid-cols-2 gap-0.5'
        }`}>
          {allImages.length === 1 && (
            <div className="overflow-hidden rounded-t-2xl group">
              <img
                src={allImages[0]}
                alt=""
                className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                loading="lazy"
                onClick={() => setImgExpanded(e => !e)}
              />
            </div>
          )}
          {allImages.length === 2 && allImages.map((url, i) => (
            <div key={i} className={`overflow-hidden group ${
              i === 0 ? 'rounded-tl-2xl' : 'rounded-tr-2xl'
            }`}>
              <img
                src={url}
                alt=""
                className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                loading="lazy"
              />
            </div>
          ))}
          {allImages.length >= 3 && (
            <>
              <div className="overflow-hidden group rounded-tl-2xl col-span-2">
                <img
                  src={allImages[0]}
                  alt=""
                  className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  loading="lazy"
                />
              </div>
              {allImages.slice(1, 3).map((url, i) => (
                <div key={i} className={`overflow-hidden group ${
                  i === 0 ? 'rounded-bl-2xl' : 'rounded-br-2xl'
                }`}>
                  <img
                    src={url}
                    alt=""
                    className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    loading="lazy"
                  />
                </div>
              ))}
            </>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="font-semibold text-slate-900 text-[12px]">{post.user_name}</span>
            <span className="text-[11px] text-slate-400 ml-auto">{timeAgo}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                ) : (
                  <><DropdownMenuItem onClick={() => onReport(post.id, 'post')}><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>
                  {onBlock && <DropdownMenuItem onClick={() => onBlock(post.user_id)} className="text-red-600"><Ban className="w-4 h-4 mr-2" />Block User</DropdownMenuItem>}</>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {(post.caption || post.body) && (
            <div className="text-[13px] text-slate-700 leading-relaxed">{post.caption || post.body}</div>
          )}
          <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-100">
            <ReactionBar postId={post.id} currentUser={currentUser} />
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1.5 h-7 px-2 rounded-full text-[12px] font-medium text-slate-500 hover:bg-slate-100">
              <MessageCircle className="w-3.5 h-3.5" />{commentCount > 0 && <span>{commentCount}</span>}
            </button>
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Event post ────────────────────────────────────────────────────────
  if (post.type === 'event') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white"
      >
        {/* Event color bar + date chip */}
        <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500" />
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-start gap-3">
            {/* Date block */}
            {post.event_date && (
              <div className="flex-shrink-0 w-10 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex flex-col items-center justify-center text-white shadow">
                <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                  {new Date(post.event_date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-[18px] font-extrabold leading-none">
                  {new Date(post.event_date).getDate()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">📅 Event</span>
                <span className="text-[11px] text-slate-400 ml-auto">{timeAgo}</span>
              </div>
              {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug mb-0.5">{post.title}</h3>}
              {post.body && <p className="text-[12px] text-slate-600 line-clamp-2">{post.body}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {post.event_time && (
                  <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                    <Clock className="w-3 h-3" />{post.event_time}
                  </span>
                )}
                {post.location_text && (
                  <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                    <MapPin className="w-3 h-3" />{post.location_text}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Author row */}
          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-100">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[11px] text-slate-500">{post.user_name}</span>
            <div className="ml-auto flex items-center gap-2">
              <ReactionBar postId={post.id} currentUser={currentUser} />
              <button
                onClick={() => setShowEventDetails(!showEventDetails)}
                className="h-8 px-4 rounded-full text-[12px] font-bold bg-green-600 text-white hover:bg-green-700 transition-colors active:scale-95"
              >
                RSVP
              </button>
            </div>
          </div>
          {showEventDetails && (
            <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <EventRSVPSection postId={post.id} currentUser={currentUser} eventDate={post.event_date} />
            </div>
          )}
          {recentComments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {recentComments.slice().reverse().map(c => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <UserAvatar name={c.author_name} size="xs" className="mt-0.5 flex-shrink-0" />
                  <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-[11px] text-slate-700 mr-1.5">{c.author_name?.split(' ')[0]}</span>
                    <span className="text-[12px] text-slate-600 leading-snug line-clamp-1">{c.body}</span>
                  </div>
                </div>
              ))}
              {commentCount > 2 && (
                <button onClick={() => setCommentsOpen(true)} className="text-[11px] font-semibold text-blue-600 pl-8">View all {commentCount} replies →</button>
              )}
            </div>
          )}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              {post.likes_count > 0 && <span>{post.likes_count} {post.likes_count === 1 ? 'person' : 'people'} going</span>}
              {post.likes_count > 0 && post.comments_count > 0 && <span>·</span>}
              {post.comments_count > 0 && <button onClick={() => setCommentsOpen(true)} className="hover:text-slate-600">{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</button>}
            </div>
          )}
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Job post ────────────────────────────────────────────────────────
  if (post.type === 'job') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white"
      >
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">💼</div>
              <div className="min-w-0">
                {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug">{post.title}</h3>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">💼 Job</span>
                  {post.location_text && <span className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="w-3 h-3" />{post.location_text}</span>}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><MoreHorizontal className="w-4 h-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReport(post.id, 'post')}><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {post.body && <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3 mb-2">{post.body}</p>}
          {recentComments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {recentComments.slice().reverse().map(c => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <UserAvatar name={c.author_name} size="xs" className="mt-0.5 flex-shrink-0" />
                  <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-[11px] text-slate-700 mr-1.5">{c.author_name?.split(' ')[0]}</span>
                    <span className="text-[12px] text-slate-600 leading-snug line-clamp-1">{c.body}</span>
                  </div>
                </div>
              ))}
              {commentCount > 2 && (
                <button onClick={() => setCommentsOpen(true)} className="text-[11px] font-semibold text-blue-600 pl-8">View all {commentCount} replies →</button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[11px] text-slate-500 flex-1">{post.user_name} · {timeAgo}</span>
            <ReactionBar postId={post.id} currentUser={currentUser} />
            {post.user_id !== currentUser?.id && (
              <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
            )}
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Housing post ────────────────────────────────────────────────────────
  if (post.type === 'housing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white"
      >
        <div className="h-1 bg-gradient-to-r from-blue-500 to-sky-600" />
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">🏠 Housing</span>
            {post.location_text && <span className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="w-3 h-3" />{post.location_text}</span>}
          </div>
          {post.title && <h3 className="font-bold text-[14px] text-slate-900 mb-0.5 leading-snug">{post.title}</h3>}
          {post.body && <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3 mb-2">{post.body}</p>}
          {recentComments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {recentComments.slice().reverse().map(c => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <UserAvatar name={c.author_name} size="xs" className="mt-0.5 flex-shrink-0" />
                  <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-[11px] text-slate-700 mr-1.5">{c.author_name?.split(' ')[0]}</span>
                    <span className="text-[12px] text-slate-600 leading-snug line-clamp-1">{c.body}</span>
                  </div>
                </div>
              ))}
              {commentCount > 2 && (
                <button onClick={() => setCommentsOpen(true)} className="text-[11px] font-semibold text-blue-600 pl-8">View all {commentCount} replies →</button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[11px] text-slate-500 flex-1">{post.user_name} · {timeAgo}</span>
            <ReactionBar postId={post.id} currentUser={currentUser} />
            {post.user_id !== currentUser?.id && <InterestedButton post={post} currentUser={currentUser} />}
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Help post ────────────────────────────────────────────────────────
  if (post.type === 'help') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-amber-50/40 border-l-[3px] border-l-amber-400"
        style={{ boxShadow: '0 1px 8px rgba(251,191,36,0.10)' }}
      >
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-base flex-shrink-0">
              {helpCat?.emoji || '🤝'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">🤝 Chesed Needed</span>
                {helpCat && <span className="text-[11px] font-semibold text-slate-500">{helpCat.label}</span>}
                {helpStatus === 'fulfilled' && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fulfilled</span>}
              </div>
                {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug">{post.title}</h3>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><MoreHorizontal className="w-4 h-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                ) : (
                  <><DropdownMenuItem onClick={() => onReport(post.id, 'post')}><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>
                  {onBlock && <DropdownMenuItem onClick={() => onBlock(post.user_id)} className="text-red-600"><Ban className="w-4 h-4 mr-2" />Block User</DropdownMenuItem>}</>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {post.body && (
            <p className="mt-1.5 text-[13px] text-slate-700 leading-relaxed line-clamp-4">
              {bodyPreview}
              {bodyLong && <button onClick={() => setExpanded(e => !e)} className="ml-1 text-blue-600 font-semibold text-[13px]">{expanded ? 'less' : 'more'}</button>}
            </p>
          )}
          {recentComments.length > 0 && (
            <div className="mt-2 mb-1 space-y-1.5">
              {recentComments.slice().reverse().map(c => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <UserAvatar name={c.author_name} size="xs" className="mt-0.5 flex-shrink-0" />
                  <div className="bg-amber-50 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-[11px] text-slate-700 mr-1.5">{c.author_name?.split(' ')[0]}</span>
                    <span className="text-[12px] text-slate-600 leading-snug line-clamp-1">{c.body}</span>
                  </div>
                </div>
              ))}
              {commentCount > 2 && (
                <button onClick={() => setCommentsOpen(true)} className="text-[11px] font-semibold text-blue-600 pl-8">View all {commentCount} replies →</button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-100">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[11px] text-slate-500 flex-1">{isAnonymous ? 'Anonymous' : post.user_name} · {timeAgo}</span>
            <ReactionBar postId={post.id} currentUser={currentUser} />
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1 h-7 px-2 rounded-full text-[12px] text-slate-500 hover:bg-slate-100">
              <MessageCircle className="w-3.5 h-3.5" />{commentCount > 0 && <span>{commentCount === 1 ? '1 reply' : `${commentCount} replies`}</span>}
            </button>
            {isOwner && helpStatus === 'open' && (
              <button onClick={handleFulfilled} disabled={fulfilling} className="h-8 px-3 rounded-full text-[12px] font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />{fulfilling ? '…' : 'Fulfilled'}
              </button>
            )}
            {post.user_id !== currentUser?.id && helpStatus === 'open' && (
              <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
            )}
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── News / community update ─────────────────────────────────────────
  if (post.type === 'news') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-slate-50"
      >
        <div className="px-3 py-2 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-base flex-shrink-0">📰</div>
          <div className="flex-1 min-w-0">
            {post.title && <p className="font-semibold text-[14px] text-slate-800 leading-snug">{post.title}</p>}
            {post.body && <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">{post.body}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">{post.user_name} · {timeAgo}</span>
              <ReactionBar postId={post.id} currentUser={currentUser} />
            </div>
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Prompt reply ────────────────────────────────────────────────────
  if (post.type === 'prompt_reply' && post.prompt_text) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3"
      >
        <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">Community Question</div>
        <div className="text-lg font-bold mt-1 leading-snug">{post.prompt_text}</div>
        {post.body && (
          <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 text-sm leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <UserAvatar user={post} name={post.user_name} size="xs" />
              <span className="font-semibold text-[12px] opacity-90">{post.user_name}</span>
            </div>
            {bodyPreview}
            {bodyLong && <button onClick={() => setExpanded(e => !e)} className="ml-1 font-bold opacity-80 text-[12px]">{expanded ? 'less' : 'more'}</button>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setCommentsOpen(true)}
            className="bg-white text-purple-700 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
          >
            Answer
          </button>
          <ReactionBar postId={post.id} currentUser={currentUser} />
          {commentCount > 0 && (
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1 text-[12px] text-white/70">
              <MessageCircle className="w-3.5 h-3.5" />{commentCount === 1 ? '1 person replied' : `${commentCount} people replied`}
            </button>
          )}
          <span className="text-[11px] text-white/60 ml-auto">{timeAgo}</span>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
      </motion.div>
    );
  }

  // ── Default feed post ────────────────────────────────────────────────
  const isQuestion = post.post_subtype === 'question';

  // Live activity signals
  const nowMs = Date.now();
  const postAgeMs = nowMs - new Date(post.created_date).getTime();
  const updatedAgeMs = post.updated_date ? nowMs - new Date(post.updated_date).getTime() : postAgeMs;
  const isActiveNow = !post.is_seeded && updatedAgeMs < 15 * 60 * 1000 && post.comments_count > 0;
  const hasNewReplies = !post.is_seeded && updatedAgeMs < 2 * 60 * 60 * 1000 && post.comments_count > 0 && !isActiveNow;
  const isHotPost = (post.likes_count || 0) + (post.comments_count || 0) * 2 >= 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`relative ${
        isQuestion ? 'bg-blue-50/60 border-l-2 border-l-blue-400' :
        post.post_subtype === 'alert' ? 'border-l-2 border-l-red-500 bg-red-50/30' :
        isActiveNow ? 'bg-white border-l-2 border-l-blue-500' :
        isHotPost ? 'bg-gradient-to-br from-orange-50/60 to-white border-l-[3px] border-l-orange-400' : 'bg-white'
      }`}
      style={isHotPost ? { boxShadow: '0 2px 16px rgba(251,146,60,0.12), 0 1px 4px rgba(0,0,0,0.04)' } : undefined}
    >
      {/* Community boost label */}
      {isFromJoinedCommunity && !isQuestion && post.post_subtype !== 'alert' && (
        <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-violet-400" />
      )}
      {/* Question highlight bar */}
      {isQuestion && <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />}
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm flex-shrink-0 font-semibold">?</div>
              <div>
                <span className="font-semibold text-[#0F1C2E] text-[14px]">Anonymous</span>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">{timeAgo}</p>
              </div>
            </div>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-2 min-w-0">
              <UserAvatar user={post} name={post.user_name} size="xs" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#0F1C2E] text-[13px] truncate">{post.user_name}</span>
                  {post.helper_badge && post.helper_badge !== 'none' && <HelperBadge badge={post.helper_badge} size="sm" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-semibold ${isVeryRecent ? 'text-green-600' : 'text-[#98A2B3]'}`}>{timeAgo}</span>
                  {communityName ? (
                    <><span className="text-[#C8D0DC] text-[10px]">·</span><button onClick={() => onCommunityClick?.(post.community_id)} className="text-[10px] text-[#2563EB] font-semibold hover:underline">📌 {communityName}</button></>
                  ) : post.city ? (
                    <><span className="text-[#C8D0DC] text-[10px]">·</span><span className="text-[10px] text-[#2563EB] font-medium">{post.city}</span></>
                  ) : null}
                </div>
              </div>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(() => {
            const ageMs = Date.now() - new Date(post.created_date).getTime();
            const isNew = !post.is_seeded && ageMs < 2 * 60 * 60 * 1000;
            return (
              <>
                {isActiveNow && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                    Active now
                  </span>
                )}
                {!isActiveNow && hasNewReplies && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    💬 {post.comments_count} {post.comments_count === 1 ? 'reply' : 'replies'}
                  </span>
                )}
                {!isActiveNow && !hasNewReplies && isHotPost && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">🔥 Hot</span>}
                {!isActiveNow && !hasNewReplies && !isHotPost && isNew && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">🟢 New</span>}
              </>
            );
          })()}
          {post.post_subtype && SUBTYPE_CONFIGS[post.post_subtype] ? (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SUBTYPE_CONFIGS[post.post_subtype].color}`}>
              {SUBTYPE_CONFIGS[post.post_subtype].label}
            </span>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#64748B] hover:bg-slate-100 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onReport(post.id, 'post')}><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>
                  {onBlock && <DropdownMenuItem onClick={() => onBlock(post.user_id)} className="text-red-600"><Ban className="w-4 h-4 mr-2" />Block User</DropdownMenuItem>}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alert banner for alert subtype */}
      {post.post_subtype === 'alert' && (
        <div className="bg-red-600 px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-[12px] font-bold uppercase tracking-wide">🚨 Community Alert</span>
        </div>
      )}

      {/* Content */}
      <div className="px-3 pt-1.5 pb-1">
        {post.prompt_text && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl px-3 py-2 mb-2.5 border border-violet-100">
            <p className="text-xs text-violet-700 font-semibold">💭 {post.prompt_text}</p>
          </div>
        )}
        {post.title && <h3 className="font-bold text-[14px] text-[#0F1C2E] mb-1 leading-snug">{post.title}</h3>}
        <p className={`text-[13px] text-[#344054] leading-snug ${!expanded ? 'line-clamp-3' : ''}`}>
          {post.body}
          {bodyLong && (
            <button onClick={() => setExpanded(e => !e)} className="ml-1 text-[#2563EB] font-semibold text-[12px]">{expanded ? 'less' : 'see more'}</button>
          )}
        </p>
        {/* Image */}
        {post.image_url && (
          <div className="mt-2 -mx-3 cursor-pointer relative" onClick={() => setImgExpanded(e => !e)}>
          <img src={post.image_url} alt="" className={`w-full object-cover rounded-xl transition-all ${imgExpanded ? 'max-h-[400px]' : 'max-h-48'}`} loading="lazy" />
          </div>
        )}
        {/* Context labels */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.location_text && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold">
              <MapPin className="w-3 h-3" />{post.location_text}
            </span>
          )}
          {communityName && (
            <button
              onClick={() => onCommunityClick?.(post.community_id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-semibold hover:bg-indigo-100 active:scale-95 transition-all"
            >
              👥 {communityName}
            </button>
          )}
          {!communityName && post.city && post.city !== 'Five Towns' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
              📍 From {post.city}
            </span>
          )}
          {!communityName && (post.city === 'Five Towns' || !post.city) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-[11px] font-semibold">
              📍 From Five Towns
            </span>
          )}
        </div>
      </div>

      {/* Inline recent comments — always show 1-2 if they exist, otherwise nudge */}
      <div className="px-3 pb-2">
        {recentComments.length > 0 ? (
          <div className="space-y-1.5">
            {recentComments.slice().reverse().map(comment => (
              <div key={comment.id} className="flex items-start gap-1.5">
                <UserAvatar name={comment.author_name} size="xs" className="mt-0.5 flex-shrink-0" />
                <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                  <span className="font-semibold text-[11px] text-slate-700 mr-1.5">{comment.author_name?.split(' ')[0]}</span>
                  <span className="text-[12px] text-slate-600 leading-snug line-clamp-1">{comment.body}</span>
                </div>
              </div>
            ))}
            {post.comments_count > 2 && (
              <button
                onClick={() => setCommentsOpen(true)}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 pl-8"
              >
                View all {post.comments_count} replies →
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setQuickReplyOpen(true)}
            className="text-[12px] text-slate-400 hover:text-blue-500 transition-colors"
          >
            💬 Be the first to reply…
          </button>
        )}
      </div>

      {/* Footer: actions + engagement on one line */}
      <div className="px-3 py-1.5 border-t border-[#F2F4F7] bg-white/70 flex items-center gap-3">
        <button
          onClick={() => setQuickReplyOpen(!quickReplyOpen)}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
        >
          <MessageCircle className="w-3 h-3" />
          Reply
        </button>
        <ReactionBar postId={post.id} currentUser={currentUser} />
        {post.user_id !== currentUser?.id && (
          <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
        )}
        <BookmarkButton postId={post.id} currentUser={currentUser} />
        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
          {recentComments.length > 0 && (
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1 hover:opacity-80">
              <div className="flex -space-x-1.5">
                {recentComments.slice(0, 3).map((c, i) => (
                  <UserAvatar key={i} name={c.author_name} size="xs"
                    className="ring-1 ring-white w-4 h-4 text-[7px]"
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-400">{post.comments_count}</span>
            </button>
          )}
          {recentComments.length === 0 && post.comments_count > 0 && (
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-0.5 hover:text-slate-600">
              <MessageCircle className="w-3 h-3" /> {post.comments_count}
            </button>
          )}
          {post.likes_count > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="text-[10px]">❤️</span> {post.likes_count}
            </span>
          )}
        </div>
      </div>

      {quickReplyOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-end gap-2">
            <input
              type="text"
              placeholder="Add a quick reply..."
              value={quickReplyText}
              onChange={(e) => setQuickReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickReply();
                }
              }}
              className="flex-1 px-3 py-2 rounded-full border border-slate-200 bg-slate-50 text-[13px] placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              disabled={submittingQuickReply}
            />
            <button
              onClick={handleQuickReply}
              disabled={!quickReplyText.trim() || submittingQuickReply}
              className="h-8 px-4 rounded-full text-[12px] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {submittingQuickReply ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
      <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
    </motion.div>
  );
}