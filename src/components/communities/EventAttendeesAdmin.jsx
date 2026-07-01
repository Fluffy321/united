import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle, Clock, X, Download } from 'lucide-react';
import { filterCommunityEventRSVP } from '@/services/entityServices';

export default function EventAttendeesAdmin({ event, onClose }) {
  const { data: rsvps = [], isLoading } = useQuery({
    queryKey: ['event-rsvps-admin', event.id],
    queryFn: () => filterCommunityEventRSVP({ event_id: event.id }),
  });

  const going = rsvps.filter(r => r.status === 'going');
  const maybe = rsvps.filter(r => r.status === 'maybe');
  const notGoing = rsvps.filter(r => r.status === 'not_attending' || r.status === 'not_going');
  const purchased = going.filter(r => r.ticket_purchased);
  const pending = going.filter(r => !r.ticket_purchased && event.has_tickets && !event.is_free);

  const exportCSV = () => {
    const rows = [['Name', 'Status', 'Ticket Purchased', 'Quantity']];
    rsvps.forEach(r => {
      rows.push([
        r.user_name || 'Unknown',
        r.status,
        r.ticket_purchased ? 'Yes' : 'No',
        r.ticket_quantity || 1,
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Attendees</h2>
            <p className="text-[12px] text-slate-500 truncate max-w-[200px]">{event.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 bg-blue-50 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-5 py-3 border-b border-slate-50 flex-shrink-0">
          {!event.has_tickets ? (
            <>
              <div className="text-center">
                <p className="text-[20px] font-black text-emerald-600">{going.length}</p>
                <p className="text-[10px] text-slate-500 font-medium">Going</p>
              </div>
              <div className="text-center">
                <p className="text-[20px] font-black text-amber-500">{maybe.length}</p>
                <p className="text-[10px] text-slate-500 font-medium">Maybe</p>
              </div>
              <div className="text-center">
                <p className="text-[20px] font-black text-slate-400">{notGoing.length}</p>
                <p className="text-[10px] text-slate-500 font-medium">Not going</p>
              </div>
            </>
          ) : (
            <>
            <div className="text-center">
              <p className="text-[20px] font-black text-slate-900">{going.length}</p>
              <p className="text-[10px] text-slate-500 font-medium">Going</p>
            </div>
            {!event.is_free && (
              <>
                <div className="text-center">
                  <p className="text-[20px] font-black text-green-600">{purchased.length}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Paid</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-black text-amber-500">{pending.length}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Pending</p>
                </div>
              </>
            )}
            {event.is_free && (
              <>
                <div className="text-center">
                  <p className="text-[20px] font-black text-amber-500">{maybe.length}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Maybe</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-black text-slate-400">{event.ticket_quantity ? event.ticket_quantity - going.length : '∞'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Spots Left</p>
                </div>
              </>
            )}
            </>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rsvps.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[14px] text-slate-500">No RSVPs yet</p>
            </div>
          ) : (
            <>
              {going.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Going ({going.length})</p>
                  {going.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[12px] font-bold text-green-700">
                          {(r.user_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">{r.user_name || 'Member'}</p>
                          {r.ticket_quantity > 1 && (
                            <p className="text-[10px] text-slate-400">{r.ticket_quantity} tickets</p>
                          )}
                        </div>
                      </div>
                      {event.has_tickets && !event.is_free && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          r.ticket_purchased ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {r.ticket_purchased
                            ? <><CheckCircle className="w-3 h-3" /> Paid</>
                            : <><Clock className="w-3 h-3" /> Pending</>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {maybe.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Maybe ({maybe.length})</p>
                  {maybe.map(r => (
                    <div key={r.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[11px] font-bold text-amber-700">
                        {(r.user_name || '?')[0].toUpperCase()}
                      </div>
                      <p className="text-[13px] text-slate-600">{r.user_name || 'Member'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
