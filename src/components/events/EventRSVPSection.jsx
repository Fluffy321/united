import React, { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';

const RSVP_STATUSES = [
  { value: 'going', label: 'Going', icon: '✓', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'interested', label: 'Interested', icon: '?', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'not_going', label: 'Not Going', icon: '✕', color: 'bg-slate-50 border-slate-200 text-slate-600' },
];

export default function EventRSVPSection({ postId, currentUser, eventDate }) {
  const [userStatus, setUserStatus] = useState(null);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0, not_going: 0 });
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  useEffect(() => {
    loadRSVPData();
  }, [postId, currentUser?.id]);

  const loadRSVPData = async () => {
    setLoading(true);
    if (!appParams.hasBackendConfig) {
      setRsvpCounts({ going: 3, interested: 2, not_going: 0 });
      setAttendees([
        { id: 'demo-rsvp-1', user_name: 'Local demo' },
        { id: 'demo-rsvp-2', user_name: 'Community member' },
      ]);
      setLoading(false);
      return;
    }
    try {
      const allRSVPs = await dataService.entities.RSVP.filter({ post_id: postId });
      
      const counts = { going: 0, interested: 0, not_going: 0 };
      let userFound = null;

      allRSVPs.forEach(rsvp => {
        counts[rsvp.status] = (counts[rsvp.status] || 0) + 1;
        if (rsvp.user_id === currentUser?.id) {
          userFound = rsvp.status;
        }
      });

      setRsvpCounts(counts);
      setUserStatus(userFound);
      setAttendees(allRSVPs.filter(r => r.status === 'going'));
    } catch (error) {
      captureError(error, { context: 'EventRSVPSection: load RSVP data' });
    }
    setLoading(false);
  };

  const handleRSVP = async (status) => {
    if (!currentUser) {
      toast.error('Please log in to RSVP');
      return;
    }

    setUpdating(true);
    if (!appParams.hasBackendConfig) {
      setUserStatus(prev => prev === status ? null : status);
      setRsvpCounts(prev => {
        const next = { ...prev };
        if (userStatus) next[userStatus] = Math.max(0, next[userStatus] - 1);
        if (status !== userStatus) next[status] = (next[status] || 0) + 1;
        return next;
      });
      toast.success(status === userStatus ? 'RSVP removed locally' : 'RSVP saved locally');
      setUpdating(false);
      return;
    }
    try {
      // Remove existing RSVP if any
      if (userStatus) {
        const existing = await dataService.entities.RSVP.filter({ 
          post_id: postId, 
          user_id: currentUser.id 
        });
        if (existing[0]) {
          await dataService.entities.RSVP.delete(existing[0].id);
        }
      }

      // Create new RSVP or just update status
      if (status !== userStatus) {
        await dataService.entities.RSVP.create({
          post_id: postId,
          user_id: currentUser.id,
          user_name: currentUser.display_name || currentUser.full_name,
          user_avatar_url: currentUser.avatar_url,
          status: status,
        });
        setUserStatus(status);
        toast.success(`You're ${status === 'going' ? 'going!' : 'interested!'} 🎉`);
      } else {
        setUserStatus(null);
        toast.success('RSVP removed');
      }

      await loadRSVPData();
    } catch (error) {
      toast.error('Failed to update RSVP');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalRSVPs = rsvpCounts.going + rsvpCounts.interested;

  return (
    <div className="space-y-3">
      {/* RSVP Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {RSVP_STATUSES.map(status => (
          <button
            key={status.value}
            onClick={() => handleRSVP(status.value)}
            disabled={updating}
            className={`py-2 px-3 rounded-lg text-[12px] font-semibold border transition-all active:scale-95 ${
              userStatus === status.value
                ? `${status.color} border-current`
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="text-lg mb-0.5">{status.icon}</div>
            <div>{status.label}</div>
            {rsvpCounts[status.value] > 0 && (
              <div className="text-[10px] font-bold mt-0.5">{rsvpCounts[status.value]}</div>
            )}
          </button>
        ))}
      </div>

      {/* Attendees Preview */}
      {totalRSVPs > 0 && (
        <div>
          <button
            onClick={() => setShowAttendees(!showAttendees)}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between group hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-[13px] font-semibold text-slate-900">
                {totalRSVPs} attending
              </span>
            </div>
            <span className="text-[12px] text-slate-500 group-hover:text-slate-700">
              {showAttendees ? '−' : '+'}
            </span>
          </button>

          {/* Attendees List */}
          {showAttendees && attendees.length > 0 && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {attendees.map(attendee => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50"
                >
                  {attendee.user_avatar_url ? (
                    <img
                      src={attendee.user_avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0">
                      {attendee.user_name?.[0]}
                    </div>
                  )}
                  <span className="text-[13px] font-medium text-slate-900 truncate">
                    {attendee.user_name}
                  </span>
                  <span className="text-[11px] text-green-600 font-semibold ml-auto flex-shrink-0">
                    Going
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
