import { dataService } from '@/services';

export const DVAR_TORAH_KIND = 'jewish_dvar_torah';

export function canModerateDvarTorah(user) {
  const role = String(user?.role || user?.verified_type || '').toLowerCase();
  return ['admin', 'moderator', 'rav', 'rabbi', 'contributor'].includes(role) || user?.is_admin === true;
}

export function canAutoApproveDvarTorah(user) {
  const role = String(user?.role || user?.verified_type || '').toLowerCase();
  return ['admin', 'rav', 'rabbi', 'contributor'].includes(role) || user?.is_admin === true;
}

function displayName(user) {
  return user?.display_name || user?.full_name || user?.email || 'Community member';
}

function matchesReading(post, reading) {
  if (!reading) return true;
  return (
    post.dvar_torah_parsha_date === reading.date ||
    post.dvar_torah_parsha_title === reading.title
  );
}

export async function listDvarTorahPosts(reading, { includePending = false, currentUserId = null } = {}) {
  const posts = await dataService.entities.UnifiedPost.filter({ activity_kind: DVAR_TORAH_KIND }, '-created_date', 100);
  return posts
    .filter((post) => matchesReading(post, reading))
    .filter((post) => {
      if (post.dvar_torah_status === 'approved') return true;
      if (!includePending) return false;
      return post.dvar_torah_status === 'pending' || post.author_user_id === currentUserId || post.user_id === currentUserId;
    });
}

export async function submitDvarTorah({ reading, currentUser, title, body, authorTitle = '' }) {
  const autoApproved = canAutoApproveDvarTorah(currentUser);
  return dataService.entities.UnifiedPost.create({
    title: title.trim(),
    body: body.trim(),
    content: body.trim(),
    type: 'dvar_torah',
    post_type: 'dvar_torah',
    post_kind: DVAR_TORAH_KIND,
    activity_kind: DVAR_TORAH_KIND,
    canonical_type: DVAR_TORAH_KIND,
    privacy_level: 'public',
    visibility: 'public',
    author_user_id: currentUser?.id || null,
    user_id: currentUser?.id || null,
    author_name: displayName(currentUser),
    submitted_by_name: displayName(currentUser),
    dvar_torah_author_title: authorTitle.trim(),
    dvar_torah_parsha_title: reading?.title || null,
    dvar_torah_parsha_date: reading?.date || null,
    dvar_torah_status: autoApproved ? 'approved' : 'pending',
    needs_review: !autoApproved,
    verified: autoApproved,
    trust_status: autoApproved ? 'approved_contributor' : 'community_submitted',
  });
}

export async function approveDvarTorah(id) {
  return dataService.entities.UnifiedPost.update(id, {
    dvar_torah_status: 'approved',
    needs_review: false,
    verified: true,
    trust_status: 'approved',
  });
}

export async function rejectDvarTorah(id) {
  return dataService.entities.UnifiedPost.update(id, {
    dvar_torah_status: 'rejected',
    needs_review: false,
    verified: false,
    trust_status: 'rejected',
  });
}
