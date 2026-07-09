import React from 'react';
import { Award, Car, Clock, HandHeart, Plus, ShoppingBag } from 'lucide-react';
import Metric from './Metric';

export default function MitzvahCircleHero({
  activeView,
  hasMitzvahStats,
  totals,
  onPostRequest,
  onChangeView,
  onGoToMarketplace,
}) {
  if (activeView === 'shuls') return null;

  const quickActions = [
    {
      label: 'Post opportunity',
      detail: 'Ask or offer help',
      icon: Plus,
      onClick: onPostRequest,
    },
    {
      label: 'Do one now',
      detail: 'Browse open needs',
      icon: HandHeart,
      onClick: () => onChangeView('browse'),
    },
    {
      label: 'Share completed',
      detail: 'Build your streak',
      icon: Award,
      onClick: () => onChangeView('completed'),
    },
    {
      label: 'Carpool safely',
      detail: 'Rides in one place',
      icon: Car,
      onClick: () => onChangeView('rides'),
    },
    {
      label: 'Jewish business',
      detail: 'Work local',
      icon: ShoppingBag,
      onClick: onGoToMarketplace,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-sm">
      <div className="relative p-4 sm:p-5">
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
                <HandHeart className="h-3.5 w-3.5" />
                Real mitzvah network
              </div>
              <p className="max-w-xl text-[15px] font-black leading-6 text-slate-950">
                Post an opportunity, take a mitzvah, share what you did, and keep the community moving.
              </p>
            </div>
            <button
              onClick={onPostRequest}
              className="app-button-primary h-11 shrink-0 px-3 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Post Request</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>

          {hasMitzvahStats ? (
            <div className="grid grid-cols-3 gap-2">
              <Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" />
              <Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" />
              <Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-100 bg-white/75 px-3 py-2.5 text-[12px] font-bold text-slate-600">
              Start with one clear ask, or offer a ride before someone needs it.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="motion-press rounded-2xl border border-white bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-[12px] font-black text-slate-950">{action.label}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-500">{action.detail}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
