import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, MessageCircle, Check, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dataService } from '@/services';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EventCard({ event, currentUser, onComment, onDelete, onReport }) {
  const [attendees, setAttendees] = useState([]);
  const [isAttending, setIsAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(event.attendee_count || 0);
  const [remindMe, setRemindMe] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, [event.id]);

  const loadAttendees = async () => {
    const allAttendees = await dataService.entities.EventAttendee.filter({ event_id: event.id });
    setAttendees(allAttendees.slice(0, 5));
    setIsAttending(allAttendees.some(a => a.user_id === currentUser.id));
  };

  const handleRSVP = async () => {
    if (isAttending) {
      const myAttendee = await dataService.entities.EventAttendee.filter({ 
        event_id: event.id, 
        user_id: currentUser.id 
      });
      if (myAttendee[0]) {
        await dataService.entities.EventAttendee.delete(myAttendee[0].id);
        await dataService.entities.ChalkboardPost.update(event.id, { 
          attendee_count: Math.max(0, attendeeCount - 1) 
        });
        setAttendeeCount(prev => Math.max(0, prev - 1));
        setIsAttending(false);
        setRemindMe(false);
        toast.success('RSVP removed');
      }
    } else {
      await dataService.entities.EventAttendee.create({
        event_id: event.id,
        user_id: currentUser.id,
        user_name: currentUser.display_name,
        user_avatar: currentUser.avatar_url
      });
      await dataService.entities.ChalkboardPost.update(event.id, { 
        attendee_count: attendeeCount + 1 
      });
      setAttendeeCount(prev => prev + 1);
      setIsAttending(true);
      toast.success('You\'re going!');
    }
    loadAttendees();
  };

  const toggleReminder = () => {
    setRemindMe(!remindMe);
    if (!remindMe) {
      toast.success('We\'ll remind you 1 hour before!');
    } else {
      toast.success('Reminder cancelled');
    }
  };

  const isOwner = currentUser.id === event.author_id;
  const eventDate = event.event_date ? new Date(event.event_date) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Badge className="bg-white/20 text-white mb-1.5 text-xs">📅 Event</Badge>
            {event.is_organization_post && event.organization_name && (
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                  ✓ {event.organization_name}
                </span>
              </div>
            )}
            <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-600">
                  Delete event
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onReport(event.id, 'chalkboard')}>
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <p className="text-slate-700 text-sm">{event.content}</p>

        <div className="space-y-1.5 text-sm">
          {eventDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{event.event_time}</span>
            </div>
          )}
          {event.location_details && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{event.location_details}</span>
            </div>
          )}
        </div>

        {/* Attendees */}
        {attendeeCount > 0 && (
          <div className="flex items-center gap-3 pt-1.5 border-t">
            <div className="flex -space-x-2">
              {attendees.map((attendee, idx) => (
                <Avatar key={idx} className="w-7 h-7 border-2 border-white">
                  <AvatarImage src={attendee.user_avatar} />
                  <AvatarFallback className="text-xs">
                    {attendee.user_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-slate-600">
              {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-1.5 pt-1.5">
          <div className="flex gap-2">
            <Button 
              className={isAttending 
                ? "bg-green-600 hover:bg-green-700 flex-1" 
                : "bg-indigo-600 hover:bg-indigo-700 flex-1"
              }
              onClick={handleRSVP}
            >
              {isAttending ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  I'm Going
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  RSVP
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onComment(event)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>

          {isAttending && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={toggleReminder}
            >
              {remindMe ? '✓ Will remind you' : '🔔 Remind me 1 hour before'}
            </Button>
          )}
        </div>

        {/* Host info */}
        {!event.is_organization_post && (
          <div className="flex items-center gap-2 pt-1.5 border-t text-xs text-slate-500">
            <span>Hosted by {event.author_name}</span>
            {event.author_age_range && (
              <Badge variant="outline" className="text-xs">
                {event.author_age_range}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}