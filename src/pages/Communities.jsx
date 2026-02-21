import React, { useState, useEffect } from 'react';
import { Loader2, Users, MapPin, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ProfileSetup from '@/components/profile/ProfileSetup';

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => base44.entities.Community.list('-created_date', 50),
    enabled: !!currentUser,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
          <span className="font-bold text-slate-900 text-base">Communities</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No communities yet</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {communities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                {community.cover_image_url && (
                  <img
                    src={community.cover_image_url}
                    alt={community.name}
                    className="w-full h-28 object-cover"
                  />
                )}
                <div className="p-4 flex items-start gap-3">
                  {community.logo_url ? (
                    <img
                      src={community.logo_url}
                      alt={community.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-[#0F5ED7]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{community.name}</h3>
                      {community.is_featured && (
                        <span className="text-[10px] bg-[#EEF4FF] text-[#0F5ED7] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">Featured</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <span className="font-medium">{community.type}</span>
                      {community.neighborhood && (
                        <>
                          <span>·</span>
                          <MapPin className="w-3 h-3" />
                          <span>{community.neighborhood}</span>
                        </>
                      )}
                    </div>
                    {community.description_short && (
                      <p className="text-xs text-slate-600 line-clamp-2">{community.description_short}</p>
                    )}
                    {community.website && (
                      <a
                        href={community.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0F5ED7] font-medium mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}