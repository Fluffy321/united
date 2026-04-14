import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CommunityNetworkView from '@/components/communities/CommunityNetworkView';
import { useEffect } from 'react';

export default function CommunityPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <CommunityNetworkView
      communityId={communityId}
      currentUser={currentUser}
      onBack={() => navigate('/Communities')}
    />
  );
}