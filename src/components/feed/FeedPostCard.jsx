import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { feedBody, feedText, formatPostAge, getCardIntent, postDate, toneClasses } from '@/lib/feed/feedRanking';
import { authorColor } from '@/lib/feed/feedColors';

export default function FeedPostCard({ post, liked = false, onLike, onReply, onOpen, onMap }) {
  const intent = getCardIntent(post);
  const tone = toneClasses[intent.tone] || toneClasses.slate;
  const Icon = intent.icon || MessageCircle;
  const title = feedText(post);
  const body = feedBody(post);
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const initials = (post.author_name || 'J').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const avatarBg = authorColor(post.author_id || post.author_name || '');
  const avatarUrl = post.author_avatar_url;

  return (
    <article className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={post.author_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: avatarBg }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-slate-900 leading-tight truncate">{post.author_name || 'Neighbor'}</div>
            <div className="text-[12px] text-slate-400">{age}</div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${tone.pill}`}>
            <Icon className="h-3 w-3 shrink-0" />
            {intent.label}
          </span>
        </div>
        <button type="button" onClick={() => onOpen?.(post)} className="block w-full text-left">
          <p className="text-[16px] leading-[1.55] text-slate-900 font-medium">{title}</p>
          {body && body !== title && (
            <p className="mt-1 text-[14px] leading-snug text-slate-500 line-clamp-2">{body}</p>
          )}
        </button>
      </div>
      <div className="flex border-t border-slate-100">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400'}`}
        >
          <Heart className={`h-[17px] w-[17px] ${liked ? 'fill-rose-500' : ''}`} />
          {reactions > 0 && <span>{reactions}</span>}
        </button>
        <button
          type="button"
          onClick={() => onReply(post)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium text-slate-400"
        >
          <MessageCircle className="h-[17px] w-[17px]" />
          {replies > 0 ? <span>{replies}</span> : null}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center py-3 text-slate-400"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </article>
  );
}
