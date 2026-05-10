import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, MoreHorizontal, Flag, Trash2, MapPin, Clock, CheckCircle2, Ban, Bookmark } from 'lucide-react';
import PostImage from '@/components/common/PostImage';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import PromptCard from './PromptCard';
import PollCard from './PollCard';
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
import { dataService, findOrCreateDirectConversation } from '@/services';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import { HELP_REQUEST_CATEGORIES } from '@/components/feed/RequestHelpModal';

// Short-circuit for community prompts — thin wrapper, no memo needed
function PromptWrapper({ post, currentUser }) {
  return <PromptCard post={post} currentUser={currentUser} />;
}

const BookmarkButton = React.memo(function BookmarkButton({ postId, currentUser }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !appParams.hasBackendConfig) return;
    dataService.entities.Bookmark.filter({ post_id: postId, user_id: currentUser.id })
      .then(r => setBookmarked(r.length > 0))
      .catch(() => {});
  }, [postId, currentUser]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    if (loading) return;
    setLoading(true);
    if (!appParams.hasBackendConfig) {
      setBookmarked(value => !value);
      setLoading(false);
      toast.success(bookmarked ? 'Post unsaved locally' : 'Post saved locally');
      return;
    }
    try {
      if (bookmarked) {
        const existing = await dataService.entities.Bookmark.filter({ post_id: postId, user_id: currentUser.id });
        if (existing[0]) await dataService.entities.Bookmark.delete(existing[0].id);
        setBookmarked(false);
      } else {
        await dataService.entities.Bookmark.create({ post_id: postId, user_id: currentUser.id });
        setBookmarked(true);
        toast.success('Post saved!');
      }
    } catch {
      toast.error('Could not update bookmark. Please try again.');
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
});

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

const InterestedButton = React.memo(function InterestedButton({ post, currentUser }) {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(false);

  const handleInterested = async () => {
    try {
      const conv = await findOrCreateDirectConversation(currentUser, {
        id: post.user_id,
        name: post.user_name,
      }, {
        request_title: post.title || post.body?.substring(0, 50),
      });
      await dataService.entities.Message.create({
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
});

function UnifiedPostCard({ post, currentUser, onLike, onComment, onDelete, onReport, onBlock, blockedIds, liked, communities, onCommunityClick, isFromJoinedCommunity = false }) {
  const [expanded, setExpanded] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [helpStatus, setHelpStatus] = useState(post.help_status || 'open');
  const [fulfilling, setFulfilling] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingRSVP, setLoadingRSVP] = useState(false);
  const [commentsOpen, setCommentsOpenState] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [submittingQuickReply, setSubmittingQuickReply] = useState(false);
  const [recentComments, setRecentComments] = useState([]);

  const setCommentsOpen = useCallback((value) => {
    const nextOpen = typeof value === 'function' ? value(commentsOpen) : value;
    if (nextOpen) onComment?.(post);
    setCommentsOpenState(value);
  }, [commentsOpen, onComment, post]);

  // Always fetch 2 most recent comments — seeded posts may have real comments even with count=0
  useEffect(() => {
    if (!appParams.hasBackendConfig) return;
    dataService.entities.Comment.filter({ post_id: post.id }, '-created_date', 2)
      .then(comments => setRecentComments(comments))
      .catch(() => {});
  }, [post.id, commentCount]);

  if (post.type === 'prompt') return <PromptWrapper post={post} currentUser={currentUser} />;
  if (post.type === 'poll' || post.post_subtype === 'poll') return <PollCard post={post} currentUser={currentUser} />;

  const isOwner = currentUser?.id === post.user_id;
  const isAnonymous = post.is_anonymous;
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;
  const helpCat = HELP_REQUEST_CATEGORIES.find(c => c.value === post.category);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const communityName = useMemo(() =>
    post.community_name || (communities && post.community_id
      ? communities.find(c => c.id === post.community_id)?.name
      : null),
  [post.community_name, post.community_id, communities]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const allImages = useMemo(() =>
    post.image_urls?.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []),
  [post.image_urls, post.image_url]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { timeAgo, isVeryRecent } = useMemo(() => {
    let displayDate;
    if (post.is_seeded) {
      const hash = post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      displayDate = new Date(Date.now() - (hash % (4 * 24 * 60 * 60 * 1000)));
    } else {
      displayDate = new Date(post.created_date);
    }
    const secs = Math.floor((Date.now() - displayDate.getTime()) / 1000);
    let tAgo;
    if (secs < 60) tAgo = 'Just now';
    else if (secs < 3600) tAgo = `${Math.floor(secs / 60)}m ago`;
    else if (secs < 86400) tAgo = `${Math.floor(secs / 3600)}h ago`;
    else if (secs < 604800) tAgo = `${Math.floor(secs / 86400)}d ago`;
    else tAgo = formatDistanceToNow(displayDate, { addSuffix: true });
    return {
      timeAgo: tAgo,
      isVeryRecent: !post.is_seeded && (Date.now() - new Date(post.created_date).getTime()) < 10 * 60 * 1000,
    };
  }, [post.id, post.created_date, post.is_seeded]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isActiveNow, hasNewReplies, isHotPost } = useMemo(() => {
    const nowMs = Date.now();
    const updatedAgeMs = post.updated_date
      ? nowMs - new Date(post.updated_date).getTime()
      : nowMs - new Date(post.created_date).getTime();
    const postAgeHours = (nowMs - new Date(post.created_date).getTime()) / 3600000;
    const active = !post.is_seeded && updatedAgeMs < 15 * 60 * 1000 && commentCount > 0;
    return {
      isActiveNow: active,
      hasNewReplies: !post.is_seeded && updatedAgeMs < 2 * 60 * 60 * 1000 && commentCount > 0 && !active,
      isHotPost: postAgeHours < 48 && (post.likes_count || 0) + commentCount * 2 >= 20,
    };
  }, [post.updated_date, post.created_date, commentCount, post.likes_count, post.is_seeded]);

  const BODY_LIMIT = 200;
  const bodyLong = post.body && post.body.length > BODY_LIMIT;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const bodyPreview = useMemo(
    () => (bodyLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body),
    [post.body, expanded, bodyLong],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleFulfilled = useCallback(async () => {
    setFulfilling(true);
    if (!appParams.hasBackendConfig) {
      setHelpStatus('fulfilled');
      setFulfilling(false);
      toast.success('Marked fulfilled locally for this demo session');
      return;
    }
    await dataService.entities.UnifiedPost.update(post.id, { help_status: 'fulfilled' });
    setHelpStatus('fulfilled');
    setFulfilling(false);
    toast.success('Marked as fulfilled! 🎉');
  }, [post.id]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleQuickReply = useCallback(async () => {
    if (!quickReplyText.trim() || !currentUser) return;
    setSubmittingQuickReply(true);
    if (!appParams.hasBackendConfig) {
      setRecentComments(prev => [{
        id: `local-comment-${Date.now()}`,
        author_name: currentUser.display_name || currentUser.full_name || 'Local demo',
        body: quickReplyText.trim(),
      }, ...prev].slice(0, 2));
      setCommentCount(prev => prev + 1);
      setQuickReplyText('');
      setQuickReplyOpen(false);
      setSubmittingQuickReply(false);
      toast.success('Reply added locally for this demo session');
      return;
    }
    try {
      await dataService.entities.Comment.create({
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
  }, [quickReplyText, currentUser, post.id]);

  // ── Photo post ────────────────────────────────────────────────────────
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
            <span className="font-semibold text-slate-900 text-[12px] truncate max-w-[120px]">{post.user_name}</span>
            <span className="text-[11px] text-slate-400 ml-auto flex-shrink-0">{timeAgo}</span>
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
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
              {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug mb-0.5 line-clamp-2">{post.title}</h3>}
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
            <span className="text-[11px] text-slate-500 truncate">{post.user_name}</span>
            <div className="ml-auto flex-shrink-0 flex items-center gap-2">
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
          {(post.likes_count > 0 || commentCount > 0) && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              {post.likes_count > 0 && <span>{post.likes_count} {post.likes_count === 1 ? 'person' : 'people'} going</span>}
              {post.likes_count > 0 && commentCount > 0 && <span>·</span>}
              {commentCount > 0 && <button onClick={() => setCommentsOpen(true)} className="hover:text-slate-600">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</button>}
            </div>
          )}
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
                {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug line-clamp-2">{post.title}</h3>}
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
            <span className="text-[11px] text-slate-500 flex-1 truncate min-w-0">{post.user_name} · {timeAgo}</span>
            <ReactionBar postId={post.id} currentUser={currentUser} />
            {post.user_id !== currentUser?.id && (
              <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
            )}
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
            <span className="text-[11px] text-slate-500 flex-1 truncate min-w-0">{post.user_name} · {timeAgo}</span>
            <ReactionBar postId={post.id} currentUser={currentUser} />
            {post.user_id !== currentUser?.id && <InterestedButton post={post} currentUser={currentUser} />}
          </div>
        </div>
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
                {post.title && <h3 className="font-bold text-[14px] text-slate-900 leading-snug line-clamp-2">{post.title}</h3>}
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
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
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
              <span className="font-semibold text-[12px] opacity-90 truncate">{post.user_name}</span>
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
        <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
      </motion.div>
    );
  }

  // ── Default feed post ────────────────────────────────────────────────
  const isQuestion = post.post_subtype === 'question';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.997 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.2 } }}
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
      <div className="flex items-center justify-between px-3 pt-2 pb-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm flex-shrink-0 font-semibold">?</div>
              <div>
                <span className="font-semibold text-slate-900 text-[13px]">Anonymous</span>
                <p className="text-[10px] text-slate-400">{timeAgo}</p>
              </div>
            </div>
          ) : (
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-2 min-w-0">
              <UserAvatar user={post} name={post.user_name} size="xs" className="w-7 h-7" />
              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-[13px] truncate">{post.user_name}</span>
                  {post.helper_badge && post.helper_badge !== 'none' && <HelperBadge badge={post.helper_badge} size="sm" />}
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className={`text-[10px] font-medium ${isVeryRecent ? 'text-green-600' : 'text-slate-400'}`}>{timeAgo}</span>
                  {communityName ? (
                    <><span className="text-slate-300 text-[10px]">·</span><button onClick={() => onCommunityClick?.(post.community_id)} className="text-[10px] text-blue-600 font-semibold hover:underline">📌 {communityName}</button></>
                  ) : post.city ? (
                    (() => {
                      const net = LOCAL_NETWORKS.find(n => n.cityPreset === post.city);
                      return <><span className="text-slate-300 text-[10px]">·</span><span className="text-[10px] text-slate-500 font-medium">{net ? `${net.emoji} ${net.shortLabel}` : post.city}</span></>;
                    })()
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
                    💬 {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
                  </span>
                )}
                {!isActiveNow && !hasNewReplies && isHotPost && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">🔥 Hot</span>}
                {!isActiveNow && !hasNewReplies && !isHotPost && isNew && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">🟢 New</span>}
              </>
            );
          })()}
          {post.post_subtype && SUBTYPE_CONFIGS[post.post_subtype] && post.post_subtype !== 'discussion' ? (
            <span className={`j-chip ${
              post.post_subtype === 'question' ? 'j-chip-location' :
              post.post_subtype === 'alert' ? 'j-chip-urgent' :
              'j-chip-muted'
            }`}>
              {SUBTYPE_CONFIGS[post.post_subtype].label}
            </span>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
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
      <div className="px-3 pt-1 pb-0.5">
        {post.prompt_text && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg px-2.5 py-1.5 mb-1.5 border border-violet-100">
            <p className="text-[11px] text-violet-700 font-semibold">💭 {post.prompt_text}</p>
          </div>
        )}
        {post.title && <h3 className="font-bold text-[14px] text-slate-900 mb-0.5 leading-snug line-clamp-2">{post.title}</h3>}
        <p className={`text-[13px] text-slate-700 leading-snug ${!expanded ? 'line-clamp-3' : ''}`}>
          {post.body}
          {bodyLong && (
            <button onClick={() => setExpanded(e => !e)} className="ml-1 text-blue-600 font-semibold text-[12px]">{expanded ? 'less' : 'see more'}</button>
          )}
        </p>
        {/* Image — 4:3 with blur-up and lightbox */}
        {post.image_url && (
          <div className="mt-1.5 -mx-3">
            <PostImage src={post.image_url} alt="" />
          </div>
        )}
        {/* Context labels — location tag always shown */}
        {(post.location_text || post.city || communityName) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(post.location_text || post.city) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                <MapPin className="w-2.5 h-2.5" />{post.location_text ? `${post.location_text}, ${post.city || ''}` : post.city}
              </span>
            )}
            {communityName && (
              <button
                onClick={() => onCommunityClick?.(post.community_id)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium hover:bg-indigo-100 active:scale-95 transition-all"
              >
                👥 {communityName}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline recent comment (just 1, compact) */}
      {recentComments.length > 0 && (
        <div className="px-3 pt-1">
          <button onClick={() => setCommentsOpen(true)} className="w-full text-left">
            <div className="flex items-center gap-1.5">
              <UserAvatar name={recentComments[0].author_name} size="xs" className="flex-shrink-0" />
              <span className="text-[11px] text-slate-500 line-clamp-1">
                <span className="font-semibold text-slate-700">{recentComments[0].author_name?.split(' ')[0]}</span>
                {' '}{recentComments[recentComments.length - 1].body}
              </span>
              {commentCount > 1 && (
                <span className="flex-shrink-0 text-[11px] text-slate-400 font-medium ml-auto">+{commentCount - 1} more</span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Footer: compact action row — no duplicate comment icon */}
      <div className="px-3 py-1.5 mt-1 border-t border-slate-100 flex items-center gap-2">
        <ReactionBar postId={post.id} currentUser={currentUser} />
        <button
          onClick={() => setCommentsOpen(true)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          {commentCount > 0 ? (
            <span className="j-chip j-chip-muted">{commentCount} {commentCount === 1 ? 'reply' : 'replies'}</span>
          ) : (
            <span className="j-chip j-chip-muted">Reply</span>
          )}
        </button>
        {post.user_id !== currentUser?.id && (
          <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
        )}
        <div className="ml-auto">
          <BookmarkButton postId={post.id} currentUser={currentUser} />
        </div>
      </div>

      <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds ?? []} onCommentAdded={() => setCommentCount(c => c + 1)} />
    </motion.div>
  );
}

// Custom comparator: re-render only when data props change, not when the parent
// recreates handler callbacks on every render. Function props are excluded because
// they are stateless transforms whose closed-over values are always refreshed on
// any data-prop change (currentUser, post, etc.) that causes us to re-render.
function blockedIdsEqual(a, b) {
  if (a === b) return true;
  const aLen = a?.length ?? 0;
  const bLen = b?.length ?? 0;
  if (aLen !== bLen) return false;
  if (aLen === 0) return true;
  for (let i = 0; i < aLen; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function arePropsEqual(prev, next) {
  return (
    prev.post === next.post &&
    prev.currentUser === next.currentUser &&
    prev.liked === next.liked &&
    prev.communities === next.communities &&
    prev.isFromJoinedCommunity === next.isFromJoinedCommunity &&
    blockedIdsEqual(prev.blockedIds, next.blockedIds)
  );
}

export default React.memo(UnifiedPostCard, arePropsEqual);
