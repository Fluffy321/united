import React, { useState } from 'react';
import { Image, MapPin } from 'lucide-react';

function FeaturedDirectoryCard({ listing, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(listing.imageUrl) && !imageFailed;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(listing)}
      className="w-[164px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-slate-200/90 bg-white text-left shadow-[0_9px_24px_rgba(15,28,46,0.06)] active:scale-[0.98]"
    >
      <span className="flex h-[92px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#DCE7FF] via-[#EEF3FF] to-white text-[#2456D8]">
        {showImage ? (
          <img
            src={listing.imageUrl}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image className="h-6 w-6" />
        )}
      </span>
      <span className="block p-3">
        <strong className="line-clamp-2 block text-[12px] font-black leading-tight tracking-[-0.015em] text-slate-900">
          {listing.name}
        </strong>
        <span className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-slate-500">
          <MapPin className="h-3 w-3 text-[#2F67EC]" /> {listing.town}
        </span>
        <span className="mt-1.5 line-clamp-2 block text-[9px] font-semibold leading-snug text-slate-500">
          {listing.whyGo || listing.sourceLabel}
        </span>
      </span>
    </button>
  );
}

export default function DirectoryFeaturedRail({ title = 'Good starting points', listings, onOpen }) {
  if (!listings?.length) return null;

  return (
    <section className="mt-5">
      <div className="mb-2.5 flex items-end justify-between gap-3 px-0.5">
        <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#101A2E]">{title}</h2>
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#2861E8]">Sourced places</span>
      </div>
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {listings.map((listing) => (
          <FeaturedDirectoryCard key={listing.id} listing={listing} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
