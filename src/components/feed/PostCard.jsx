import React from 'react';
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Flag, Trash2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from '@/components/common/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PostCard({ post, currentUser, onLike, onComment, onRepost, onDelete, onReport, liked }) {
  const isOwner = currentUser?.id === post.author_id;
  const isPrompt = post.is_prompt;
  const timeAgo = formatDistanceToNow(new Date(post.created_date), { addSuffix: true });

  return (
    <div className={`rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${
      isPrompt ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' : 'bg-white border-slate-100'
    }`}>
      {post.is_repost && (
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-3 pb-3 border-b border-slate-100">
          <Repeat2 className="w-4 h-4" />
          <span>Reposted</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        {isPrompt ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{post.author_name}</span>
                <Badge variant="outline" className="text-xs font-normal bg-indigo-100 border-indigo-300 text-indigo-700">
                  Community Prompt
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{post.city}</p>
            </div>
          </div>
        ) : (
          <Link to={createPageUrl('Profile') + `?id=${post.author_id}`} className="flex items-center gap-3">
            <UserAvatar user={{...post, display_name: post.author_name}} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{post.author_name}</span>
                <Badge variant="outline" className="text-xs font-normal bg-slate-50 border-slate-200 text-slate-600">
                  {post.author_age_range}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{post.city} · {timeAgo}</p>
            </div>
          </Link>
        )}
        
        {!isPrompt && (
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onReport(post.id, 'post')}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {post.is_prompt_response && post.prompt_text && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-4 py-3 mb-4 border border-indigo-100">
          <p className="text-sm text-indigo-700 font-medium">💭 {post.prompt_text}</p>
        </div>
      )}

      <p className="text-slate-800 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-4">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
        </div>
      )}

      {post.interests && post.interests.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.interests.map((interest, i) => (
            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
              {interest}
            </Badge>
          ))}
        </div>
      )}

      <div className={`flex items-center gap-1 pt-3 ${isPrompt ? 'border-t border-indigo-200' : 'border-t border-slate-100'}`}>
        {isPrompt ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onComment(post)}
            className="gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Sparkles className="w-5 h-5" />
            <span>Share Your Response</span>
          </Button>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onLike(post.id)}
              className={`gap-2 ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onComment(post)}
              className="gap-2 text-slate-500 hover:text-indigo-600"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onRepost(post)}
              className="gap-2 text-slate-500 hover:text-green-600"
            >
              <Repeat2 className="w-5 h-5" />
              <span>{post.reposts_count || 0}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}