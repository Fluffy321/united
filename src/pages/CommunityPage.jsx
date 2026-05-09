import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CommunityDetailView from '@/components/communities/CommunityDetailView';

// Vanity slug → real community ID mapping
// Add slugs here for any community you want to support via friendly URL
const SLUG_MAP = {
  'five-towns-help': '69de6ebc518dfa52773af53c',
};

export default function CommunityPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Resolve vanity slug to real ID, or use the raw ID directly
  const resolvedId = SLUG_MAP[communityId] || communityId;
  const demoCommunity = location.state?.demoCommunity || null;

  return (
    <CommunityDetailView
      communityId={resolvedId}
      currentUser={currentUser}
      onBack={() => navigate('/Communities')}
      fallbackCommunity={demoCommunity}
    />
  );
}