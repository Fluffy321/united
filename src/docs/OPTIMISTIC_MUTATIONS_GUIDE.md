# Optimistic UI Updates Guide

## Overview
Optimistic mutations provide immediate UI feedback while server operations complete in the background, rolling back on error.

## Hook: `useOptimisticMutation`

Located in `hooks/useOptimisticMutation.js`

### Example Usage

```javascript
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

export function MyComponent({ post, currentUser }) {
  const { mutate, isPending } = useOptimisticMutation();

  const handleLike = async () => {
    mutate({
      optimisticCallback: (isOptimistic) => {
        if (isOptimistic) {
          // Apply optimistic update
          setLiked(prev => !prev);
        } else {
          // Rollback on error
          setLiked(prev => !prev);
        }
      },
      mutationFn: async () => {
        if (liked) {
          const likes = await filterLike({
            post_id: post.id,
            user_id: currentUser.id
          });
          if (likes[0]) await deleteLike(likes[0].id);
        } else {
          await createLike({
            post_id: post.id,
            user_id: currentUser.id
          });
        }
      },
      onSuccess: () => {
        console.log('Like operation succeeded');
      },
      onError: (error) => {
        console.error('Like operation failed:', error);
      }
    });
  };

  return (
    <button onClick={handleLike} disabled={isPending}>
      {isPending ? 'Updating...' : liked ? 'Unlike' : 'Like'}
    </button>
  );
}
```

## Implementation Checklist

### For Join/Follow buttons:
- [ ] Show loading state immediately
- [ ] Update follower count optimistically
- [ ] Revert count on error

### For RSVP buttons:
- [ ] Toggle RSVP state immediately
- [ ] Update attendee count
- [ ] Revert on API failure

### For Like buttons:
- [ ] Flip heart icon instantly
- [ ] Update like count
- [ ] Sync with server

### For Delete operations:
- [ ] Show confirmation (required)
- [ ] Remove item optimistically
- [ ] Restore if error

## Key Patterns

### Pattern 1: Boolean Toggle (Like, Follow, etc.)
```javascript
mutate({
  optimisticCallback: (isOptimistic) => {
    setState(prev => isOptimistic ? !prev : !prev); // Toggle immediately
  },
  mutationFn: apiCall,
  onError: () => toast.error('Failed')
});
```

### Pattern 2: Counter Update (Likes, Followers, etc.)
```javascript
mutate({
  optimisticCallback: (isOptimistic) => {
    setCount(prev => isOptimistic ? prev + 1 : prev - 1);
  },
  mutationFn: apiCall,
  onError: () => toast.error('Failed')
});
```

### Pattern 3: List Remove (Delete comments, posts, etc.)
```javascript
mutate({
  optimisticCallback: (isOptimistic) => {
    setList(prev => isOptimistic 
      ? prev.filter(item => item.id !== id) 
      : [...prev, deletedItem] // Restore
    );
  },
  mutationFn: async () => await deleteItem(id),
  onError: () => toast.error('Could not delete')
});
```

## Components to Update (Priority Order)

1. **ReactionBar** (like button) — already optimized
2. **RSVP buttons** (EventRSVPSection)
3. **Follow buttons** (communities, users)
4. **Join buttons** (groups, communities)
5. **Comment like buttons**
6. **Share/Repost buttons**
7. **Delete buttons** (with confirmation)

## Testing Optimistic Updates

1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Click action button
4. UI should update immediately
5. Wait for server response
6. Verify state matches server response
7. Disconnect network and test rollback
