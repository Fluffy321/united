import React, { useState } from 'react';
import PromptResponsesSheet from './PromptResponsesSheet';
import { useQueryClient } from '@tanstack/react-query';

export default function PromptCard({ post, currentUser }) {
  const [showSheet, setShowSheet] = useState(false);
  const [localCount, setLocalCount] = useState(post.comments_count || 0);
  const queryClient = useQueryClient();

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="w-full rounded-3xl bg-purple-50 border border-purple-100 p-4 text-left shadow-sm"
      >
        <div className="text-xs font-semibold text-purple-600 mb-2">COMMUNITY PROMPT</div>
        <div className="text-lg font-bold text-slate-900">{post.body}</div>
        <div className="mt-3 text-sm text-slate-500">{localCount} {localCount === 1 ? 'response' : 'responses'}</div>
      </button>

      <PromptResponsesSheet
        post={post}
        currentUser={currentUser}
        open={showSheet}
        onOpenChange={setShowSheet}
        onResponseAdded={() => {
          setLocalCount(c => c + 1);
          queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
        }}
      />
    </>
  );
}