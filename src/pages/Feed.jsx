import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// ISOLATION DEBUG MODE
// Step 1: raw posts only — no comments, reactions, bookmarks, communities, trending

export default function Feed() {
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['debug-posts'],
    queryFn: async () => {
      const raw = await base44.entities.UnifiedPost.list('-updated_date', 100);
      console.log('[DEBUG] raw posts response type:', typeof raw, Array.isArray(raw));
      console.log('[DEBUG] first 3 raw items:', raw?.slice?.(0, 3));
      const safe = (Array.isArray(raw) ? raw : []).filter(
        item => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0
      );
      console.log('[DEBUG] safe posts count:', safe.length, 'filtered out:', (Array.isArray(raw) ? raw.length : 0) - safe.length);
      return safe;
    },
    staleTime: 30000,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading posts...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-mono">
        🔍 ISOLATION DEBUG MODE — Raw posts only<br />
        Posts fetched: {posts.length}
      </div>

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-mono mb-1">id: {post.id} | type: {post.type}</div>
            {post.title && <div className="font-semibold text-slate-900 mb-1">{post.title}</div>}
            <div className="text-sm text-slate-600 line-clamp-3">{post.body}</div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center text-slate-400 py-12">No posts found</div>
      )}
    </div>
  );
}