import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { COMMUNITIES_ENABLED } from '@/config/features';

export default function CommunitiesSection({ userCommunities }) {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);

  const { data: allCommunities = [] } = useQuery({
    queryKey: ['profile-communities'],
    queryFn: () => dataService.entities.Community.list('-follower_count', 100),
    staleTime: 300000
  });

  useEffect(() => {
    if (!allCommunities || !userCommunities) return;
    const communityIds = userCommunities.map(uc => uc.community_id);
    const userComms = allCommunities.filter(c => communityIds.includes(c.id));
    setCommunities(userComms.slice(0, 5));
  }, [allCommunities.length, userCommunities.length]);

  if (!COMMUNITIES_ENABLED || communities.length === 0) return null;

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="surface-panel-soft rounded-[24px] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">Active in...</h2>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">{communities.length} communities shaping this profile.</p>
          </div>
          <button
            onClick={() => navigate('/Communities')}
            className="motion-press rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition-colors"
          >
            See All
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {communities.map(community => (
            <button
              key={community.id}
              onClick={() => navigate(`/communities/${community.id}`)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg transition-shadow">
                {community.logo_url ? (
                  <img src={community.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(community.name)
                )}
              </div>
              <p className="text-xs text-slate-600 text-center line-clamp-2 w-16">
                {community.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
