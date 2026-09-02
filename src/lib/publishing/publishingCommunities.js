export function resolvePublishingCommunities(memberships = [], communities = []) {
  const communityById = new Map(
    (communities || [])
      .filter((community) => community?.id)
      .map((community) => [String(community.id), community]),
  );
  const seen = new Set();

  return (memberships || [])
    .filter((membership) => membership?.community_id)
    .filter((membership) => !membership.status || membership.status === 'active')
    .filter((membership) => {
      const communityId = String(membership.community_id);
      if (seen.has(communityId)) return false;
      seen.add(communityId);
      return true;
    })
    .map((membership) => {
      const id = String(membership.community_id);
      const catalogCommunity = communityById.get(id);
      return {
        id,
        name: catalogCommunity?.name || membership.community_name || membership.name || 'Community',
      };
    });
}
