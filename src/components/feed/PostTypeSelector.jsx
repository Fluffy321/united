import React from 'react';
import { Calendar, Briefcase, Megaphone, MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function PostTypeSelector({ open, onOpenChange, onSelectType }) {
  const postTypes = [
    { 
      icon: Calendar, 
      label: 'Post Event', 
      description: 'Share an upcoming community event',
      type: 'event', 
      color: 'text-blue-700',
      bg: 'bg-blue-50'
    },
    { 
      icon: Briefcase, 
      label: 'Job / Opportunity', 
      description: 'Share a job or volunteer opening',
      type: 'job', 
      color: 'text-green-700',
      bg: 'bg-green-50'
    },
    { 
      icon: Megaphone, 
      label: 'Announcement', 
      description: 'Share community news or updates',
      type: 'feed', 
      color: 'text-slate-700',
      bg: 'bg-slate-100'
    },
    { 
      icon: MoreHorizontal, 
      label: 'Other', 
      description: 'Anything else on your mind',
      type: 'feed', 
      color: 'text-slate-500',
      bg: 'bg-slate-100'
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Choose what to post</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 pb-6">
          {postTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.type}
                onClick={() => {
                  onSelectType(type.type);
                  onOpenChange(false);
                }}
                className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`flex-shrink-0 w-12 h-12 ${type.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${type.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 mb-0.5">{type.label}</div>
                  <div className="text-sm text-slate-500">{type.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}