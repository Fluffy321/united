import React, { useState, useEffect } from 'react';
import { MessageCircle, MoreHorizontal, Flag, Trash2, Calendar, MapPin, Clock, CheckCircle2, Users, Ban } from 'lucide-react';
import PromptCard from './PromptCard';
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
// (Rendered before exports so the hook rules are satisfied)
function PromptWrapper({ post, currentUser }) {
  return <PromptCard post={post} currentUser={currentUser} />;
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

export default function UnifiedPostCard({ post, currentUser, onLike, onComment, onDelete, onReport, onBlock, blockedIds = [], liked, communities }) {
  if (post.type === 'prompt') return <PromptWrapper post={post} currentUser={currentUser} />;

  const isOwner = currentUser?.id === post.user_id;
  const communityName = post.community_name || (communities && post.community_id
    ? communities.find(c => c.id === post.community_id)?.name
    : null);
  const isAnonymous = post.is_anonymous;

  // For seeded posts, generate a deterministic spread-out timestamp from post ID
  const getDisplayDate = () => {
    if (post.is_seeded) {
      const hash = post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const maxMs = 4 * 24 * 60 * 60 * 1000; // 4 days
      return new Date(Date.now() - (hash % maxMs));
    }
    return new Date(post.created_date);
  };

  const timeAgo = formatDistanceToNow(getDisplayDate(), { addSuffix: true });
  const typeConfig = TYPE_CONFIGS[post.type] || TYPE_CONFIGS.feed;
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

  const helpCat = HELP_REQUEST_CATEGORIES.find(c => c.value === post.category);

  const handleFulfilled = async () => {
    setFulfilling(true);
    await base44.entities.UnifiedPost.update(post.id, { help_status: 'fulfilled' });
    setHelpStatus('fulfilled');
    setFulfilling(false);
    toast.success('Marked as fulfilled! 🎉');
  };

  const BODY_LIMIT = 120;
  const bodyLong = post.body && post.body.length > BODY_LIMIT;
  const bodyPreview = bodyLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body;

  // ── Photo post ────────────────────────────────────────────────────────
  const allImages = post.image_urls?.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
  if (allImages.length > 0 && post.type === 'feed' && !post.title) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-sm overflow-hidden"
      >
        {/* Image grid */}
        <div className={`overflow-hidden ${
          allImages.length === 1 ? '' :
          allImages.length === 2 ? 'grid grid-cols-2 gap-0.5' :
          'grid grid-cols-2 gap-0.5'
        }`}>
          {allImages.length === 1 && (
            <div className="overflow-hidden rounded-t-3xl group">
              <img
                src={allImages[0]}
                alt=""
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                loading="lazy"
                onClick={() => setImgExpanded(e => !e)}
              />
            </div>
          )}
          {allImages.length === 2 && allImages.map((url, i) => (
            <div key={i} className={`overflow-hidden group ${
              i === 0 ? 'rounded-tl-3xl' : 'rounded-tr-3xl'
            }`}>
              <img
                src={url}
                alt=""
                className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                loading="lazy"
              />
            </div>
          ))}
          {allImages.length >= 3 && (
            <>
              <div className="overflow-hidden group rounded-tl-3xl col-span-2">
                <img
                  src={allImages[0]}
                  alt=""
                  className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  loading="lazy"
                />
              </div>
              {allImages.slice(1, 3).map((url, i) => (
                <div key={i} className={`overflow-hidden group ${
                  i === 0 ? 'rounded-bl-3xl' : 'rounded-br-3xl'
                }`}>
                  <img
                    src={url}
                    alt=""
                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    loading="lazy"
                  />
                </div>
              ))}
            </>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="font-semibold text-slate-900 text-[13px]">{post.user_name}</span>
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
            <div className="text-sm text-slate-700 leading-relaxed">{post.caption || post.body}</div>
          )}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100">
            <ReactionBar postId={post.id} currentUser={currentUser} />
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium text-slate-500 hover:bg-slate-100">
              <MessageCircle className="w-4 h-4" />{commentCount > 0 && <span>{commentCount}</span>}
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
        className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm"
      >
        {/* Event color bar + date chip */}
        <div className="h-2 bg-gradient-to-r from-green-500 to-teal-500" />
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Date block */}
            {post.event_date && (
              <div className="flex-shrink-0 w-12 h-14 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex flex-col items-center justify-center text-white shadow">
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                  {new Date(post.event_date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-[22px] font-extrabold leading-none">
                  {new Date(post.event_date).getDate()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">📅 Event</span>
                <span className="text-[11px] text-slate-400 ml-auto">{timeAgo}</span>
              </div>
              {post.title && <h3 className="font-bold text-[16px] text-slate-900 leading-snug mb-1">{post.title}</h3>}
              {post.body && <p className="text-[13px] text-slate-600 line-clamp-2">{post.body}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
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
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[12px] text-slate-500">{post.user_name}</span>
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
        className="rounded-2xl overflow-hidden bg-white border border-green-100 shadow-sm"
      >
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">💼</div>
              <div className="min-w-0">
                {post.title && <h3 className="font-bold text-[15px] text-slate-900 leading-snug">{post.title}</h3>}
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
          {post.body && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3 mb-3">{post.body}</p>}
          <div className="flex items-center gap-2">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[12px] text-slate-500 flex-1">{post.user_name} · {timeAgo}</span>
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
        className="rounded-2xl overflow-hidden bg-white border border-blue-100 shadow-sm"
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 to-sky-600" />
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">🏠 Housing</span>
            {post.location_text && <span className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="w-3 h-3" />{post.location_text}</span>}
          </div>
          {post.title && <h3 className="font-bold text-[15px] text-slate-900 mb-1 leading-snug">{post.title}</h3>}
          {post.body && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3 mb-3">{post.body}</p>}
          <div className="flex items-center gap-2">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[12px] text-slate-500 flex-1">{post.user_name} · {timeAgo}</span>
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
        className="rounded-2xl overflow-hidden bg-white border-l-4 border-purple-500 shadow-sm"
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">
              {helpCat?.emoji || '🤝'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">🤝 Chesed Needed</span>
                {helpCat && <span className="text-[11px] font-semibold text-slate-500">{helpCat.label}</span>}
                {helpStatus === 'fulfilled' && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fulfilled</span>}
              </div>
              {post.title && <h3 className="font-bold text-[15px] text-slate-900 leading-snug">{post.title}</h3>}
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
            <p className="mt-2 text-[14px] text-slate-700 leading-relaxed">
              {bodyPreview}
              {bodyLong && <button onClick={() => setExpanded(e => !e)} className="ml-1 text-blue-600 font-semibold text-[13px]">{expanded ? 'less' : 'more'}</button>}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            <UserAvatar user={post} name={post.user_name} size="xs" />
            <span className="text-[12px] text-slate-500 flex-1">{isAnonymous ? 'Anonymous' : post.user_name} · {timeAgo}</span>
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
        className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200"
      >
        <div className="px-4 py-3 flex items-start gap-3">
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
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl p-4 shadow-md"
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
  const isActive = post.comments_count > 0;
  const getActivityStatus = () => {
    if (!isActive) return null;
    const ageMs = Date.now() - new Date(post.created_date).getTime();
    const ageMinutes = ageMs / (1000 * 60);
    if (ageMinutes < 30) return `🔥 ${post.comments_count} active`;
    if (ageMinutes < 120) return `💬 ${post.comments_count} replies`;
    return null;
  };
  const activityStatus = getActivityStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className={`rounded-2xl border overflow-hidden ${
        isQuestion ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' :
        post.post_subtype === 'alert' ? 'border-red-300' : 'border-[#EAECF0]'
      }`}
      style={{
        boxShadow: isQuestion ? '0 2px 12px rgba(37,99,235,0.12)' : (post.post_subtype === 'alert' ? '0 2px 10px rgba(220,38,38,0.12)' : '0 2px 10px rgba(0,0,0,0.07)'),
      }}
    >
      {/* Question highlight bar */}
      {isQuestion && <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />}
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
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
            <Link to={createPageUrl('Profile') + `?id=${post.user_id}`} className="flex items-center gap-2.5 min-w-0">
              <UserAvatar user={post} name={post.user_name} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#0F1C2E] text-[14px] truncate">{post.user_name}</span>
                  {post.helper_badge && post.helper_badge !== 'none' && <HelperBadge badge={post.helper_badge} size="sm" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-[#98A2B3]">{timeAgo}</span>
                  {communityName ? (
                    <><span className="text-[#C8D0DC] text-[10px]">·</span><span className="text-[11px] text-[#2563EB] font-semibold">📌 {communityName}</span></>
                  ) : post.city ? (
                    <><span className="text-[#C8D0DC] text-[10px]">·</span><span className="text-[11px] text-[#2563EB] font-medium">{post.city}</span></>
                  ) : null}
                </div>
              </div>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(() => {
            const score = (post.likes_count || 0) + (post.comments_count || 0) * 2;
            const ageMs = Date.now() - new Date(post.created_date).getTime();
            const isNew = !post.is_seeded && ageMs < 2 * 60 * 60 * 1000;
            const isHot = score >= 20;
            return (
              <>
                {isHot && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">🔥 Hot</span>}
                {isNew && !isHot && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">🟢 New</span>}
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
      <div className="px-4 pt-3.5 pb-1.5">
        {post.prompt_text && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl px-3 py-2 mb-2.5 border border-violet-100">
            <p className="text-xs text-violet-700 font-semibold">💭 {post.prompt_text}</p>
          </div>
        )}
        {post.title && <h3 className="font-bold text-[15px] text-[#0F1C2E] mb-1.5 leading-snug">{post.title}</h3>}
        <p className="text-[14.5px] text-[#344054] leading-relaxed">
          {bodyPreview}
          {bodyLong && (
            <button onClick={() => setExpanded(e => !e)} className="ml-1 text-[#2563EB] font-semibold text-[13px]">{expanded ? 'less' : 'more'}</button>
          )}
        </p>
        {/* Image */}
        {post.image_url && (
          <div className="mt-3 -mx-4 cursor-pointer relative" onClick={() => setImgExpanded(e => !e)}>
            <img src={post.image_url} alt="" className={`w-full object-cover rounded-xl transition-all ${imgExpanded ? 'max-h-[480px]' : 'max-h-60'}`} loading="lazy" />
          </div>
        )}
        {post.location_text && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold">
              <MapPin className="w-3 h-3" />{post.location_text}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 mt-1 border-t border-[#F2F4F7] bg-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Quick Reply Button */}
          <button 
            onClick={() => setCommentsOpen(true)} 
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Reply
          </button>
          <div className="flex items-center gap-1 flex-1">
            <ReactionBar postId={post.id} currentUser={currentUser} />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {post.user_id !== currentUser?.id && (
              <MessageButton recipientId={post.user_id} recipientName={post.user_name} postId={post.id} postTitle={post.title || post.body?.substring(0, 50)} postType={post.type} currentUser={currentUser} variant="compact" />
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      {(post.comments_count > 0 || post.likes_count > 0) && (
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/50">
        {post.comments_count > 0 && (
          <button 
            onClick={() => setCommentsOpen(true)}
            className="hover:text-slate-700 font-semibold flex items-center gap-1 group"
          >
            <span className="group-hover:scale-110 transition-transform">💬</span> {post.comments_count} {post.comments_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
        {post.likes_count > 0 && (
          <span className="flex items-center gap-1">
            <span>❤️</span> {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
          </span>
        )}
      </div>
      )}
        {post.comments_count > 0 && (
          <span className="flex items-center gap-1">
            💬 {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </span>
        )}
        {post.likes_count > 0 && (
          <span className="flex items-center gap-1">
            ❤️ {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
          </span>
        )}
        {post.type === 'event' && post.rsvp_count && post.rsvp_count > 0 && (
          <span className="flex items-center gap-1">
            📍 {post.rsvp_count} {post.rsvp_count === 1 ? 'person' : 'people'} interested
          </span>
        )}
        {post.type === 'help' && post.offers_count && post.offers_count > 0 && (
          <span className="flex items-center gap-1">
            🤝 {post.offers_count} {post.offers_count === 1 ? 'offer' : 'offers'}
          </span>
        )}
      </div>

      <CommentsSheet postId={post.id} postAuthorId={post.user_id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} currentUser={currentUser} blockedIds={blockedIds} />
    </motion.div>
  );
}