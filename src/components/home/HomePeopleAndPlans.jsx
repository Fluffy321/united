import React from 'react';
import { ArrowRight, CalendarPlus, Users } from 'lucide-react';
import HomeCircleActivity from './HomeCircleActivity';
import HomeSectionHeading from './HomeSectionHeading';
import HomeTonight from './HomeTonight';

export default function HomePeopleAndPlans({
  activity = { active: [], quiet: [] },
  eventWindow = { mode: 'empty', items: [] },
  circlesLoading = false,
  eventsLoading = false,
  eventsError = false,
  onOpenCommunity,
  onBrowseCommunities,
  onRetryEvents,
  onOpenEvent,
  onOpenEvents,
  onAddEvent,
}) {
  const circleItems = activity.active?.length ? activity.active : activity.quiet || [];
  const hasCircles = circleItems.length > 0;
  const hasEvents = (eventWindow.items || []).length > 0;
  const showCombinedEmpty = !circlesLoading && !eventsLoading && !eventsError && !hasCircles && !hasEvents;

  return (
    <section className="space-y-2.5" aria-labelledby="home-people-plans-title">
      <HomeSectionHeading
        eyebrow="Your community"
        title="People and plans"
        titleId="home-people-plans-title"
        tone="violet"
      />

      {showCombinedEmpty ? (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,28,46,0.045)]">
          <p className="text-[13px] font-black text-slate-900">Nothing new here yet</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Find your people or add a real local plan.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={onBrowseCommunities} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-violet-100 px-2 text-[10px] font-black text-violet-800">
              <Users className="h-4 w-4" /> Browse communities
            </button>
            <button type="button" onClick={onAddEvent} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-orange-100 px-2 text-[10px] font-black text-orange-800">
              <CalendarPlus className="h-4 w-4" /> Add an event
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(circlesLoading || hasCircles) && (
            <HomeCircleActivity
              embedded
              activity={activity}
              isLoading={circlesLoading}
              onOpenCommunity={onOpenCommunity}
              onBrowseCommunities={onBrowseCommunities}
            />
          )}
          {(eventsLoading || eventsError || hasEvents) && (
            <HomeTonight
              embedded
              window={eventWindow}
              isLoading={eventsLoading}
              isError={eventsError}
              onRetry={onRetryEvents}
              onOpenEvent={onOpenEvent}
              onOpenAll={onOpenEvents}
              onAddEvent={onAddEvent}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onBrowseCommunities} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-700">
              Communities <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onOpenEvents} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-700">
              All plans <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
