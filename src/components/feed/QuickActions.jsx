import React from 'react';
import { MessageSquare, HandHeart, Calendar, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function QuickActions({ onAction }) {
  const actions = [
    { icon: MessageSquare, label: 'Ask Question', type: 'feed', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { icon: HandHeart, label: 'Need Help', type: 'help', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { icon: Calendar, label: 'Post Event', type: 'event', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { icon: Briefcase, label: 'Job/Opportunity', type: 'job', color: 'bg-green-100 text-green-700 hover:bg-green-200' }
  ];

  return (
    <div className="mb-6">
      <p className="text-sm text-slate-600 mb-3 font-medium">What would you like to do today?</p>
      <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.type}
            variant="outline"
            className={`h-auto py-4 flex-col gap-2 ${action.color} border-0`}
            onClick={() => onAction(action.type)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        );
      })}
      </div>
    </div>
  );
}