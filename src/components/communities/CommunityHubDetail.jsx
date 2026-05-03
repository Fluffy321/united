import React from 'react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  Heart,
  MessageCircle,
  Pin,
  Shield,
  UserRound,
  Users,
} from 'lucide-react';

const typeStyles = {
  Announcement: 'bg-blue-50 text-blue-700',
  Question: 'bg-slate-100 text-slate-700',
  Event: 'bg-rose-50 text-rose-700',
  'Chesed request': 'bg-emerald-50 text-emerald-700',
  'Learning post': 'bg-amber-50 text-amber-700',
};

const roleStyles = {
  Admin: 'bg-slate-950 text-white',
  Moderator: 'bg-blue-50 text-blue-700',
  Member: 'bg-slate-100 text-slate-600',
};

export default function CommunityHubDetail({ community, onBack, onToggleJoin, onToggleLike }) {
  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-28">
      <section className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <button
          onClick={onBack}
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-white px-5 py-7 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{community.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{community.privacy}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{community.location}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{community.name}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{community.description}</p>
              </div>

              <button
                onClick={onToggleJoin}
                className={`h-11 shrink-0 rounded-xl px-5 text-sm font-bold transition active:scale-[0.98] ${
                  community.joined
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {community.joined ? 'Leave Community' : 'Join Community'}
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Members" value={community.memberCount.toLocaleString()} />
              <Metric icon={MessageCircle} label="Posts" value={community.posts.length} />
              <Metric icon={Shield} label="Roles" value={community.roles.length} />
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5 border-b border-slate-200 p-5 lg:border-b-0 lg:border-r sm:p-7">
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

            <aside className="space-y-5 p-5 sm:p-7">
              <Panel title="About" icon={Users}>
                <p className="text-sm leading-6 text-slate-600">{community.description}</p>
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
