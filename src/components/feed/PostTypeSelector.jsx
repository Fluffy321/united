import React from 'react';
import { MessageSquare, HandHeart, Calendar, Briefcase } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function PostTypeSelector({ open, onOpenChange, onSelectType }) {
  const postTypes = [
    { 
      icon: MessageSquare, 
      label: 'Ask Question', 
      description: 'Get advice or start a discussion',
      type: 'feed', 
      color: 'text-slate-700'
    },
    { 
      icon: HandHeart, 
      label: 'Need Help', 
      description: 'Request assistance from the community',
      type: 'help', 
      color: 'text-amber-700'
    },
    { 
      icon: Calendar, 
      label: 'Post Event', 
      description: 'Share an upcoming event',
      type: 'event', 
      color: 'text-blue-700'
    },
    { 
      icon: Briefcase, 
      label: 'Job/Opportunity', 
      description: 'Share a job or volunteer opportunity',
      type: 'job', 
      color: 'text-green-700'
    }
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
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
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