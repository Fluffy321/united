import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';

const FeedComposer = forwardRef(function FeedComposer({
  currentUser,
  userCommunities,
  onPostCreated,
}, ref) {
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState('feed');
  const [initialSubtype, setInitialSubtype] = useState(null);
  const [initialBody, setInitialBody] = useState('');

  const openComposer = useCallback((options = {}) => {
    setPostType(options.type || 'feed');
    setInitialSubtype(options.subtype || null);
    setInitialBody(options.initialBody || '');
    setOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({
    open: openComposer,
  }), [openComposer]);

  const handleOpenChange = useCallback((nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      onPostCreated?.();
      setInitialSubtype(null);
      setInitialBody('');
    }
  }, [onPostCreated]);

  return (
    <UnifiedPostModal
      open={open}
      onOpenChange={handleOpenChange}
      currentUser={currentUser}
      postType={postType}
      initialSubtype={initialSubtype}
      initialBody={initialBody}
      userCommunities={userCommunities}
    />
  );
});

export default FeedComposer;
