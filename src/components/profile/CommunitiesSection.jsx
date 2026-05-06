import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { useNavigate } from 'react-router-dom';

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

  if (communities.length === 0) return null;

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">My Communities</h2>
          <button
            onClick={() => navigate('/Communities')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            See All
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {communities.map(community => (
            <button
              key={community.id}
              onClick={() => navigate(`/Communities?communityId=${community.id}`)}
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