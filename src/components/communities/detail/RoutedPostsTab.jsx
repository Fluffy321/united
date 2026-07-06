import { Loader2, Lock } from 'lucide-react';
import { CommunityPostPreview } from '../CommunityOperatingSystem';
import ComposerBox from './ComposerBox';
import CompactEmptyState from './CompactEmptyState';
import { matchesTab } from './shared';

export default function RoutedPostsTab({ posts, isLoading, activeTab, typeConfig, composeText, setComposeText, submitPost, posting, canPost }) {
  const filteredPosts = posts.filter((post) => matchesTab(post, activeTab));
  return (
    <div className="space-y-4 pt-4">
      {canPost ? (
        <ComposerBox
          typeConfig={typeConfig}
          composeText={composeText}
          setComposeText={setComposeText}
          submitPost={submitPost}
          posting={posting}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : (
        <RoutedPostsList posts={filteredPosts} typeConfig={typeConfig} tabKey={activeTab} />
      )}
    </div>
  );
}

function RoutedPostsList({ posts, typeConfig, emptyCompact = false, tabKey }) {
  if (!posts.length) {
    if (emptyCompact) return null;
    return <CompactEmptyState typeConfig={typeConfig} tabKey={tabKey} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
    </div>
  );
}
