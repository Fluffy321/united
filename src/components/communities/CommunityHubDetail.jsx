import React from 'react';
import {
  ArrowLeft,
  Bell,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  EyeOff,
  Heart,
  MessageCircle,
  Pin,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

const typeStyles = {
  Announcement: 'bg-blue-50 text-blue-700',
  Question: 'bg-slate-100 text-slate-700',
  Event: 'bg-rose-50 text-rose-700',
  'Chesed request': 'bg-emerald-50 text-emerald-700',
  'Learning post': 'bg-amber-50 text-amber-700',
  'Check-in': 'bg-violet-50 text-violet-700',
  Prompt: 'bg-blue-50 text-blue-700',
  Match: 'bg-cyan-50 text-cyan-700',
  Plan: 'bg-emerald-50 text-emerald-700',
  Resource: 'bg-indigo-50 text-indigo-700',
};

const roleStyles = {
  Admin: 'bg-slate-950 text-white',
  Moderator: 'bg-blue-50 text-blue-700',
  Member: 'bg-slate-100 text-slate-600',
};

export default function CommunityHubDetail({ community, onBack, onToggleJoin, onToggleLike, onUpdatePrivacy }) {
  const isSupport = community.communityType === 'support';
  const canPostAnonymously = Boolean(community.supportsAnonymousPosting);
  const isHidden = Boolean(community.hideMembership || community.hideMembershipDefault);

  return (
    <main className="min-h-screen bg-[#F7F9FC] mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-6 sm:pt-8">
        <button
          onClick={onBack}
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-white px-4 py-5 sm:px-7 sm:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{community.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{community.privacyLabel || community.privacy}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{community.location}</span>
                  {community.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Official
                    </span>
                  )}
                  {isSupport && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                      <EyeOff className="h-3.5 w-3.5" />
                      Safe-space controls
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{community.name}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{community.description}</p>
              </div>

              <button
                onClick={() => onToggleJoin?.(isSupport ? { incognito: true } : {})}
                className={`h-11 shrink-0 rounded-xl px-5 text-sm font-bold transition active:scale-[0.98] ${
                  community.joined
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {community.joined ? 'Leave Community' : isSupport ? 'Join Incognito' : 'Join Community'}
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Metric icon={Users} label="Members" value={community.memberCount.toLocaleString()} />
              <Metric icon={MessageCircle} label="Posts" value={community.posts.length} />
              <Metric icon={ShieldCheck} label="Privacy" value={community.privacyLabel || community.privacy} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(community.identityTags || []).map((tag) => (
                <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r sm:p-7">
              {isSupport && (
                <Panel title="Privacy Controls" icon={EyeOff}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PrivacyToggle
                      title="Join incognito"
                      description="Membership is hidden from your public profile and community badges."
                      checked={isHidden}
                      onChange={(checked) => onUpdatePrivacy?.({ hideMembership: checked, joinedIncognito: checked })}
                    />
                    <PrivacyToggle
                      title="Post anonymously"
                      description="Replies can appear as Anonymous member inside this support space."
                      checked={canPostAnonymously}
                      disabled
                    />
                  </div>
                </Panel>
              )}

              <Panel title="Today’s Interactive Prompt" icon={SparkPromptIcon}>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[12px] font-black uppercase tracking-wide text-blue-700">Reply starter</p>
                  <h2 className="mt-1 text-lg font-black leading-6 text-slate-950">{community.dailyPrompt}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(community.quickActions || []).map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="motion-press rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-600 hover:text-white"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="Posts Feed" icon={MessageCircle}>
                <div className="space-y-3">
                  {community.posts.map((post) => (
                    <CommunityPost key={post.id} post={post} onToggleLike={() => onToggleLike(post.id)} />
                  ))}
                </div>
              </Panel>

              <div className="grid gap-5 md:grid-cols-2">
                <Panel title="Events" icon={CalendarDays}>
                  <SimpleList items={community.events} emptyText="No events yet." />
                </Panel>
                <Panel title="Announcements" icon={Bell}>
                  <SimpleList items={community.announcements} emptyText="No announcements yet." />
                </Panel>
              </div>

              <Panel title="Resources" icon={BookOpen}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {community.resources.map((resource) => (
                    <div key={resource} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      {resource}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <aside className="space-y-4 p-4 sm:p-7">
              <Panel title="About" icon={Users}>
                <p className="text-sm leading-6 text-slate-600">{community.description}</p>
              </Panel>

              <Panel title="Identity & Privacy" icon={Shield}>
                <div className="space-y-2 text-sm leading-5 text-slate-600">
                  <InfoLine label="Community type" value={community.communityType === 'official' ? 'Platform-owned / curated' : community.communityType === 'support' ? 'Sensitive private identity' : community.communityType === 'lifestyle' ? 'Lifestyle / interest' : 'User-created'} />
                  <InfoLine label="Visibility" value={community.privacyLabel || community.privacy} />
                  <InfoLine label="Profile exposure" value={isHidden ? 'Hidden from profile' : 'Can show as an Active in tag'} />
                  <InfoLine label="Anonymous posting" value={canPostAnonymously ? 'Available in this space' : 'Not enabled'} />
                </div>
              </Panel>

              <Panel title="Rules" icon={Shield}>
                <ol className="space-y-2">
                  {community.rules.map((rule, index) => (
                    <li key={rule} className="flex gap-2 text-sm leading-5 text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {index + 1}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="Members & Roles" icon={UserRound}>
                <div className="space-y-3">
                  {community.roles.map((member) => (
                    <div key={`${member.name}-${member.role}`} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-700">{member.name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${roleStyles[member.role]}`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function SparkPromptIcon(props) {
  return <MessageCircle {...props} />;
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="max-w-[160px] text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function PrivacyToggle({ title, description, checked, onChange, disabled = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={`motion-press relative h-7 w-12 shrink-0 rounded-full transition ${
            checked ? 'bg-blue-600' : 'bg-slate-300'
          } ${disabled ? 'cursor-default opacity-80' : ''}`}
          aria-pressed={checked}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <Icon className="h-4 w-4 text-blue-600" />
        {value}
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-950">
        <Icon className="h-4 w-4 text-blue-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function CommunityPost({ post, onToggleLike }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeStyles[post.type] || 'bg-slate-100 text-slate-700'}`}>
          {post.type}
        </span>
        {post.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
            <Pin className="h-3 w-3" />
            Pinned
          </span>
        )}
        <span className="text-xs font-medium text-slate-400">{post.time}</span>
      </div>

      <h3 className="text-base font-bold text-slate-950">{post.title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{post.body}</p>
      <p className="mt-3 text-xs font-semibold text-slate-500">Posted by {post.author}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onToggleLike}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition active:scale-[0.98] ${
            post.liked ? 'bg-rose-50 text-rose-700' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
          {post.likes}
        </button>
        <div className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-bold text-slate-600">
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </div>
      </div>
    </article>
  );
}

function SimpleList({ items, emptyText }) {
  if (!items.length) return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {item}
        </div>
      ))}
    </div>
  );
}
