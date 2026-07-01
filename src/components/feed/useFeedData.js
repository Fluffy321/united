import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { appParams } from '@/lib/app-params';
import { withFeedTimeout } from '@/lib/feed/feedRanking';

const PAGE_SIZE = 30;

export function useFeedData() {
  const query = useInfiniteQuery({
    queryKey: ['unified-posts'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!appParams.hasBackendConfig) return [];
      try {
        const posts = await withFeedTimeout(
          dataService.entities.PostFeedView.list('-updated_date', PAGE_SIZE, pageParam * PAGE_SIZE)
        );
        return Array.isArray(posts) ? posts : [];
      } catch (error) {
        console.warn('Feed posts request failed:', error?.message || error);
        return [];
      }
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined
    ),
    staleTime: 30000,
    refetchInterval: (queryState) => {
      const loadedPages = queryState.state.data?.pages?.length || 0;
      return loadedPages <= 1 ? 60000 : false;
    },
  });

  const posts = useMemo(() => {
    const seen = new Set();
    return (query.data?.pages || []).flatMap((page) => page).filter((post) => {
      if (!post?.id) return true;
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [query.data]);

  return {
    posts,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    isLoading: query.isLoading || query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useFeedData;
