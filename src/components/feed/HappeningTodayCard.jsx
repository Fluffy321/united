import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HappeningTodayCard({ event, onView }) {
  return (
    <div className="bg-white rounded-xl border border-orange-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{event.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="font-bold text-orange-600">{event.event_time}</span>
              </div>
            </div>
          </div>
          {event.location_text && (
            <div className="flex items-center gap-1 text-sm text-slate-600 ml-12">
              <MapPin className="w-3 h-3" />
              <span>{event.location_text}</span>
            </div>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={() => onView(event)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Details
        </Button>
      </div>
    </div>
  );
}