import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Calendar,
  ChevronDown,
  Globe2,
  HeartHandshake,
  HelpCircle,
  Image,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { dataService, notificationsService, checkRateLimit, RateLimitError } from '@/services';
import postsService from '@/services/postsService';
import { ACTIVITY_KIND } from '@/lib/productInfrastructure';
import { toast } from 'sonner';

const POST_TYPES = [
  { value: 'post', label: 'Post', icon: MessageCircle, tone: 'from-blue-500 to-cyan-500', soft: 'bg-blue-50 text-blue-700', placeholder: "What's happening in the Five Towns?" },
  { value: 'ask', label: 'Ask', icon: HelpCircle, tone: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-50 text-violet-700', placeholder: 'Ask neighbors for a rec, ride, host, game, or advice...' },
  { value: 'event', label: 'Event', icon: Calendar, tone: 'from-orange-500 to-amber-500', soft: 'bg-orange-50 text-orange-700', placeholder: 'Tell people what is happening and why they should come...' },
  { value: 'alert', label: 'Alert', icon: Bell, tone: 'from-red-500 to-rose-500', soft: 'bg-red-50 text-red-700', placeholder: 'Share something people should know before they head out...' },
  { value: 'poll', label: 'Poll', icon: BarChart2, tone: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-50 text-emerald-700', placeholder: 'Ask the Five Towns to choose...' },
  { value: 'help', label: 'Need Help', icon: HeartHandshake, tone: 'from-rose-500 to-pink-500', soft: 'bg-rose-50 text-rose-700', placeholder: 'What do you need help with right now?' },
  { value: 'marketplace', label: 'Sell / Give', icon: ShoppingBag, tone: 'from-teal-500 to-sky-500', soft: 'bg-teal-50 text-teal-700', placeholder: 'What are you selling, giving, or looking for?' },
];

const HELP_CATEGORIES = [
  { value: 'advice', label: 'Advice' },
  { value: 'support', label: 'Support' },
  { value: 'school', label: 'School' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'family', label: 'Family' },
  { value: 'recommendation', label: 'Local rec' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

const MARKET_CATEGORIES = [
  'Furniture',
  'Baby / kids',
  'Clothing',
  'Judaica',
  'Books',
  'Food',
  'Services',
  'Other',
];

const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  { value: 'today', label: 'Today', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  { value: 'urgent', label: 'Urgent', className: 'border-red-200 bg-red-50 text-red-700' },
];

const CITY_OPTIONS = ['Five Towns', 'Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood'];

const typeFromLegacyProps = (postType, initialSubtype) => {
  if (postType === 'help') return 'help';
  if (postType === 'event' || initialSubtype === 'event') return 'event';
  if (postType === 'job' || postType === 'housing' || postType === 'food' || initialSubtype === 'marketplace') return 'marketplace';
  if (initialSubtype === 'question') return 'ask';
  if (initialSubtype === 'alert') return 'alert';
  if (initialSubtype === 'poll') return 'poll';
  return 'post';
};

const titleFromBody = (value) => {
  const firstLine = (value || '').split('\n').find(Boolean) || '';
  return firstLine.trim().slice(0, 80);
};

export default function UnifiedPostModal({
  open,
  onOpenChange,
  currentUser,
  postType = 'feed',
  promptId = null,
  promptText = null,
  initialSubtype = null,
  initialBody = '',
  initialCommunityId = null,
  userCommunities = [],
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [postKind, setPostKind] = useState(typeFromLegacyProps(postType, initialSubtype));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCity, setSelectedCity] = useState('Five Towns');
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunityId || '');
  const [destinationMode, setDestinationMode] = useState(initialCommunityId ? 'community' : 'five-towns');
  const [showLocation, setShowLocation] = useState(false);
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('today');
  const [neededBy, setNeededBy] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketCategory, setMarketCategory] = useState('');
  const [pickupOption, setPickupOption] = useState('pickup');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [caption, setCaption] = useState('');
  const [starterPlaceholder, setStarterPlaceholder] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = useMemo(
    () => POST_TYPES.find((item) => item.value === postKind) || POST_TYPES[0],
    [postKind]
  );
  const selectedCommunity = userCommunities.find((community) => community.id === selectedCommunityId);
  const userInitials = (currentUser?.display_name || currentUser?.full_name || 'J').charAt(0).toUpperCase();
  const isPromptReply = Boolean(promptId);
  const needsUrgency = postKind === 'help' || postKind === 'alert';
  const canPost = body.trim().length > 0 || title.trim().length > 0;
  const submitDisabled = isSubmitting || !canPost || (postKind === 'poll' && pollOptions.filter((option) => option.trim()).length < 2);

  useEffect(() => {
    if (!open) return;
    const nextType = typeFromLegacyProps(postType, initialSubtype);
    setPostKind(nextType);
    setTitle('');
    setBody('');
    setStarterPlaceholder(initialBody || '');
    setLocation('');
    setSelectedCity(currentUser?.cityPreset || 'Five Towns');
    setSelectedCommunityId(initialCommunityId || '');
    setDestinationMode(initialCommunityId ? 'community' : 'five-towns');
    setShowLocation(false);
    setCategory('');
    setUrgency(nextType === 'alert' ? 'urgent' : 'today');
    setNeededBy('');
    setEventDate('');
    setEventTime('');
    setMarketPrice('');
    setMarketCategory('');
    setPickupOption('pickup');
    setIsAnonymous(false);
    setPollOptions(['', '']);
    setCaption('');
    setImageUrls([]);
    setTimeout(() => textareaRef.current?.focus(), 120);
  }, [open, postType, initialSubtype, initialBody, initialCommunityId, currentUser]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !open) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 84), 172)}px`;
  }, [body, open, postKind]);

  const getSubmitLabel = () => {
    if (!canPost) return 'Write something first';
    if (postKind === 'poll' && pollOptions.filter((option) => option.trim()).length < 2) return 'Add poll choices';
    if (postKind === 'help') return 'Ask for Help';
    if (postKind === 'event') return 'Share Event';
    if (postKind === 'poll') return 'Post Poll';
    if (postKind === 'marketplace') return 'Post Listing';
    if (postKind === 'alert') return 'Send Alert';
    if (postKind === 'ask') return 'Ask Community';
    return 'Share Post';
  };

  const getBoard = () => {
    if (postKind === 'event') return 'events';
    if (postKind === 'help') return 'help';
    if (postKind === 'marketplace') return 'marketplace';
    return 'feed';
  };

  const getUnifiedType = () => {
    if (isPromptReply) return 'prompt_reply';
    if (postKind === 'post') return 'feed';
    if (postKind === 'ask') return 'question';
    if (postKind === 'marketplace') return 'marketplace';
    return postKind;
  };

  const getActivityKind = () => {
    if (postKind === 'marketplace') return ACTIVITY_KIND.MARKETPLACE_LISTING;
    if (postKind === 'help') return ACTIVITY_KIND.MITZVAH_REQUEST;
    if (selectedCommunityId) return ACTIVITY_KIND.COMMUNITY_POST;
    return ACTIVITY_KIND.FEED_POST;
  };

  const resetAfterPost = () => {
    setTitle('');
    setBody('');
    setStarterPlaceholder('');
    setLocation('');
    setSelectedCommunityId('');
    setDestinationMode('five-towns');
    setShowLocation(false);
    setCategory('');
    setNeededBy('');
    setEventDate('');
    setEventTime('');
    setMarketPrice('');
    setMarketCategory('');
    setPickupOption('pickup');
    setIsAnonymous(false);
    setPollOptions(['', '']);
    setCaption('');
    setImageUrls([]);
  };

  const handleSubmit = async () => {
    const trimmedBody = body.trim();
    const trimmedTitle = title.trim() || titleFromBody(trimmedBody);
    if (!trimmedBody && !trimmedTitle) {
      toast.error('Write something first');
      return;
    }

    const validPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (postKind === 'poll' && validPollOptions.length < 2) {
      toast.error('Add at least two poll options');
      return;
    }

    setIsSubmitting(true);
    try {
      await checkRateLimit('create_post');

      const postData = {
        user_id: currentUser?.id || 'local-demo-user',
        user_name: isAnonymous ? 'Anonymous' : currentUser?.display_name || currentUser?.full_name || 'Local member',
        user_age_range: currentUser?.age_range,
        user_avatar_url: currentUser?.avatar_url || currentUser?.profile_image_url || undefined,
        activity_kind: getActivityKind(),
        type: getUnifiedType(),
        board: getBoard(),
        title: trimmedTitle || undefined,
        body: trimmedBody || trimmedTitle,
        content: trimmedBody || trimmedTitle,
        location_text: location.trim() || selectedCity,
        city: selectedCity || currentUser?.cityPreset || 'Five Towns',
        is_anonymous: isAnonymous,
        category: postKind === 'help' ? category || undefined : undefined,
        urgency: needsUrgency ? urgency : undefined,
        needed_by: postKind === 'help' ? neededBy || undefined : undefined,
        request_kind: postKind === 'help' ? category || 'community_help' : undefined,
        event_date: postKind === 'event' ? eventDate || undefined : undefined,
        event_time: postKind === 'event' ? eventTime || undefined : undefined,
        poll_options: postKind === 'poll' ? validPollOptions : undefined,
        marketplace_category: postKind === 'marketplace' ? marketCategory || undefined : undefined,
        price: postKind === 'marketplace' ? marketPrice.trim() || undefined : undefined,
        pickup_option: postKind === 'marketplace' ? pickupOption : undefined,
        prompt_id: promptId || undefined,
        prompt_text: promptText || undefined,
        image_url: imageUrls[0] || undefined,
        image_urls: imageUrls.length ? imageUrls : undefined,
        caption: caption.trim() || undefined,
        post_subtype: postKind,
        community_id: selectedCommunityId || undefined,
        community_name: selectedCommunity?.name || undefined,
        replies_enabled: true,
        reactions_enabled: true,
      };

      const created = await postsService.createPost(postData);

      if (selectedCommunity?.id) {
        const recipientIds = selectedCommunity.member_ids || selectedCommunity.memberIds || [];
        recipientIds
          .filter((memberId) => memberId && memberId !== currentUser?.id)
          .slice(0, 25)
          .forEach((memberId) => {
            notificationsService.notifyCommunityActivity({
              userId: memberId,
              actorId: currentUser?.id,
              actorName: currentUser?.display_name || currentUser?.full_name,
              communityId: selectedCommunity.id,
              communityName: selectedCommunity.name,
              postId: created.id,
            }).catch(() => {});
          });
      }

      if (created?.id && (trimmedBody || trimmedTitle).length > 10) {
        dataService.functions.invoke('moderateContent', {
          text: [trimmedTitle, trimmedBody].filter(Boolean).join(' '),
          content_id: created.id,
          content_type: 'unified_post',
          author_id: currentUser?.id,
        }).catch(() => {});
      }

      if (promptId) {
        const prompt = await dataService.entities.DailyFeedPrompt.filter({ id: promptId });
        if (prompt[0]) {
          await dataService.entities.DailyFeedPrompt.update(promptId, {
            replies_count: (prompt[0].replies_count || 0) + 1,
          });
        }
      }

      toast.success('Posted');
      onOpenChange(false);
      resetAfterPost();
    } catch (error) {
      if (error instanceof RateLimitError) toast.error(error.message);
      else toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagePick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImages(true);
    try {
      const { uploadImage } = await import('@/lib/imageUpload');
      const { url } = await uploadImage(file);
      setImageUrls((current) => [...current, url].slice(0, 3));
    } catch {
      toast.error('Could not upload image');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleComposerKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!submitDisabled) handleSubmit();
    }
  };

  const renderTypeSpecificFields = () => {
    if (postKind === 'event') {
      return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black text-slate-500">Event details</p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" className="mb-2 h-10 rounded-xl border-slate-200 bg-slate-50 font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white font-semibold" />
            <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white font-semibold" />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <MapPin className="h-4 w-4 text-slate-500" />
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location optional" className="h-10 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
          </div>
        </div>
      );
    }

    if (postKind === 'poll') {
      return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black text-slate-500">Poll choices</p>
          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                  placeholder={`Choice ${index + 1}`}
                  maxLength={80}
                  className="h-10 rounded-xl border-slate-200 bg-white font-semibold"
                />
                {pollOptions.length > 2 && (
                  <button type="button" onClick={() => setPollOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {pollOptions.length < 6 && (
            <button type="button" onClick={() => setPollOptions((current) => [...current, ''])} className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 active:scale-95">
              <Plus className="h-3.5 w-3.5" /> Add choice
            </button>
          )}
        </div>
      );
    }

    if (postKind === 'help') {
      return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black text-slate-500">Need details</p>
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {URGENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUrgency(option.value)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition active:scale-95 ${urgency === option.value ? option.className : 'border-slate-200 bg-white text-slate-500'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={neededBy} onChange={(e) => setNeededBy(e.target.value)} placeholder="Needed by" className="h-10 rounded-xl border-slate-200 bg-slate-50 font-semibold" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none">
              <option value="">Category optional</option>
              {HELP_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous((value) => !value)}
            className="mt-2 flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition active:scale-[0.99]"
          >
            <span>Post anonymously</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${isAnonymous ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {isAnonymous ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      );
    }

    if (postKind === 'marketplace') {
      return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black text-slate-500">Listing details</p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it?" className="mb-2 h-10 rounded-xl border-slate-200 bg-slate-50 font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} placeholder="Price or Free" className="h-10 rounded-xl border-slate-200 bg-slate-50 font-semibold" />
            <select value={marketCategory} onChange={(e) => setMarketCategory(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none">
              <option value="">Category</option>
              {MARKET_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            {['pickup', 'delivery', 'either'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPickupOption(option)}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-black capitalize transition active:scale-95 ${pickupOption === option ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (postKind === 'alert') {
      return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black text-slate-500">Alert level</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {URGENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUrgency(option.value)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition active:scale-95 ${urgency === option.value ? option.className : 'border-slate-200 bg-white text-slate-500'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const SelectedTypeIcon = selectedType.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-0 top-auto flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-[30px] border-0 bg-white p-0 shadow-2xl sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[82dvh] sm:w-[calc(100%-28px)] sm:max-w-[420px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[30px] [&>button]:hidden">
        <DialogTitle className="sr-only">Create post</DialogTitle>

        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedType.tone} text-white shadow-lg shadow-blue-900/10`}>
              <SelectedTypeIcon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-950">Start a {selectedType.label.toLowerCase()}</h2>
              <p className="truncate text-xs font-bold text-slate-500">Keep it local. Keep it useful.</p>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close composer" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-4 py-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-xs font-black text-white">
                {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="" className="h-full w-full object-cover" /> : userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">{isAnonymous ? 'Anonymous' : currentUser?.display_name || currentUser?.full_name || 'Local member'}</p>
                <p className="truncate text-xs font-bold text-slate-400">{selectedCommunity?.name || (destinationMode === 'feed' ? 'Feed' : selectedCity)}</p>
              </div>
              <div className="relative shrink-0">
                <SelectedTypeIcon className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${selectedType.soft.split(' ').slice(1).join(' ')}`} />
                <select
                  value={postKind}
                  onChange={(event) => setPostKind(event.target.value)}
                  aria-label="Post type"
                  className={`h-9 appearance-none rounded-full border border-slate-200 py-0 pl-8 pr-8 text-xs font-black outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 ${selectedType.soft}`}
                >
                  {POST_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              aria-label="Write post"
              placeholder={starterPlaceholder || selectedType.placeholder}
              maxLength={1000}
              className="mt-2 min-h-[84px] resize-none overflow-y-auto rounded-none border-0 bg-transparent px-0 py-2 text-[18px] font-semibold leading-7 text-slate-950 shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95">
                {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <span className={`text-xs font-black tabular-nums ${body.length > 900 ? 'text-red-500' : 'text-slate-300'}`}>{body.length}/1000</span>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {renderTypeSpecificFields()}

            <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Where it goes</p>
                <button
                  type="button"
                  onClick={() => setShowLocation((current) => !current)}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-black transition active:scale-95 ${showLocation ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {location || selectedCity}
                </button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDestinationMode('feed');
                    setSelectedCommunityId('');
                  }}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black transition active:scale-95 ${destinationMode === 'feed' ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestinationMode('five-towns');
                    setSelectedCommunityId('');
                  }}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black transition active:scale-95 ${destinationMode === 'five-towns' ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Five Towns
                </button>
                {userCommunities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationMode('community');
                      setSelectedCommunityId((current) => current || userCommunities[0]?.id || '');
                    }}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black transition active:scale-95 ${destinationMode === 'community' ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Community
                  </button>
                )}
              </div>

              {destinationMode === 'community' && userCommunities.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto border-t border-slate-100 pt-2">
                  {userCommunities.map((community) => (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() => setSelectedCommunityId(community.id)}
                      className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-black transition active:scale-95 ${selectedCommunityId === community.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      {community.name}
                    </button>
                  ))}
                </div>
              )}

              {showLocation && postKind !== 'event' && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CITY_OPTIONS.map((city) => (
                      <button key={city} type="button" onClick={() => setSelectedCity(city)} className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-black transition active:scale-95 ${selectedCity === city ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                        {city}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Optional spot, address, or shul" className="h-9 min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {imageUrls.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={url} className="relative h-14 w-14 overflow-hidden rounded-xl">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption optional" maxLength={200} className="h-10 rounded-xl border-slate-200 bg-slate-50 font-semibold" />
              </div>
            )}

            {postKind === 'alert' && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Alerts should be real, local, and useful. They can notify people faster than a normal post.
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          <Button onClick={handleSubmit} disabled={submitDisabled} className={`h-12 w-full rounded-2xl bg-gradient-to-r ${selectedType.tone} text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 disabled:saturate-75 disabled:shadow-sm`}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Posting...' : getSubmitLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
