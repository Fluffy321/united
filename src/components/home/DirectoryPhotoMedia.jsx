import React, { useEffect, useRef, useState } from 'react';
import { Image, MapPin } from 'lucide-react';
import { useDirectoryPhoto } from '@/hooks/useDirectoryPhoto';

const FALLBACK_TONES = {
  'jewish-life': 'from-indigo-100 via-blue-50 to-white text-indigo-700',
  food: 'from-amber-100 via-orange-50 to-white text-amber-700',
  family: 'from-sky-100 via-cyan-50 to-white text-sky-700',
  shopping: 'from-pink-100 via-rose-50 to-white text-pink-700',
  health: 'from-emerald-100 via-teal-50 to-white text-emerald-700',
  services: 'from-slate-200 via-slate-50 to-white text-slate-700',
  community: 'from-violet-100 via-purple-50 to-white text-violet-700',
  'things-to-do': 'from-orange-100 via-yellow-50 to-white text-orange-700',
};

export function selectDirectoryPhoto(listing, runtimePhoto, failedKinds = new Set()) {
  if (
    listing?.imageUrl &&
    listing?.imageSourceUrl &&
    !failedKinds.has('official')
  ) {
    return {
      kind: 'official',
      imageUrl: listing.imageUrl,
      sourceUrl: listing.imageSourceUrl,
      sourceLabel: listing.imageSourceLabel || listing.sourceLabel || 'Official source',
    };
  }

  if (
    runtimePhoto?.status === 'ready' &&
    runtimePhoto.imageUrl &&
    runtimePhoto.sourceUrl &&
    !failedKinds.has('google')
  ) {
    return { kind: 'google', ...runtimePhoto };
  }
  return null;
}

export function DirectoryPhotoMediaView({
  listing,
  runtimePhoto = null,
  isLoading = false,
  className = 'aspect-[4/3]',
  fallbackClassName = '',
  eager = false,
  compact = false,
}) {
  const [failedKinds, setFailedKinds] = useState(() => new Set());
  useEffect(() => setFailedKinds(new Set()), [listing?.id, runtimePhoto?.imageUrl]);
  const photo = selectDirectoryPhoto(listing, runtimePhoto, failedKinds);
  const fallbackTone = FALLBACK_TONES[listing?.groupId] || 'from-slate-200 via-slate-50 to-white text-slate-600';

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br ${className} ${photo ? '' : fallbackTone} ${fallbackClassName}`}>
      {photo ? (
        <img
          src={photo.imageUrl}
          alt={`${listing?.name || 'Directory place'} in the Five Towns`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailedKinds((current) => new Set([...current, photo.kind]))}
          className="h-full w-full object-cover"
        />
      ) : isLoading ? (
        <div className="flex h-full items-center justify-center bg-slate-100">
          <span className="h-8 w-8 animate-pulse rounded-full bg-slate-200" aria-label="Loading photo" />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <Image className="h-5 w-5" />
          </span>
          {!compact && <span className="text-[10px] font-black">Explore {listing?.name || 'this place'}</span>}
          {!compact && listing?.town && <span className="flex items-center gap-1 text-[9px] font-bold opacity-70"><MapPin className="h-3 w-3" />{listing.town}</span>}
        </div>
      )}

      {photo?.kind === 'official' && (
        <a
          href={photo.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Official photo · ${photo.sourceLabel}`}
          className="absolute bottom-1.5 right-1.5 z-10 rounded-full bg-black/65 px-2 py-1 text-[8px] font-bold text-white backdrop-blur"
        >
          {compact ? 'Official' : `Official photo · ${photo.sourceLabel}`}
        </a>
      )}
      {photo?.kind === 'google' && (
        <div className="absolute bottom-1.5 right-1.5 z-10 flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[8px] font-bold text-white backdrop-blur">
          {photo.authorUri ? (
            <a href={photo.authorUri} target="_blank" rel="noreferrer" aria-label={`Photo by ${photo.authorName || 'Google user'}`} className="truncate">{compact ? 'Google' : `Photo by ${photo.authorName || 'Google user'}`}</a>
          ) : (
            <span className="truncate">Photo via Google</span>
          )}
          {!compact && <span aria-hidden="true">·</span>}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open photo source in Google Maps" className="shrink-0">{compact ? '↗' : 'Google Maps'}</a>
        </div>
      )}
    </div>
  );
}

function DirectoryPhotoMediaRuntime(props) {
  const { listing, eager = false } = props;
  const rootRef = useRef(null);
  const [isVisible, setIsVisible] = useState(eager);

  useEffect(() => {
    if (eager || isVisible || !rootRef.current) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsVisible(true);
      observer.disconnect();
    }, { rootMargin: '240px' });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [eager, isVisible]);

  const { photo, isLoading } = useDirectoryPhoto(listing, { enabled: isVisible });
  return <div ref={rootRef}><DirectoryPhotoMediaView {...props} runtimePhoto={photo} isLoading={isLoading} /></div>;
}

export default function DirectoryPhotoMedia(props) {
  if (typeof window === 'undefined') return <DirectoryPhotoMediaView {...props} />;
  return <DirectoryPhotoMediaRuntime {...props} />;
}
