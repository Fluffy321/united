import { useQuery } from '@tanstack/react-query';
import { requestDirectoryPhoto } from '@/services/directoryPhotoService';

export function useDirectoryPhoto(listing, { enabled = true } = {}) {
  const listingId = listing?.id || '';
  const canRequest = Boolean(enabled && listingId && !listing?.imageUrl);
  const query = useQuery({
    queryKey: ['directory-photo', listingId],
    queryFn: () => requestDirectoryPhoto(listingId),
    enabled: canRequest,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    photo: query.data || null,
    isLoading: canRequest && query.isLoading,
  };
}
