import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import LogNewMitzvahModal from '@/components/mitzvah/LogNewMitzvahModal';
import { createMitzvahLog, filterMitzvahLog, filterUserStreak } from '@/services/entityServices';

export default function MyMitzvahLogTab({ currentUser }) {
  const [showLogModal, setShowLogModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', currentUser?.id],
    queryFn: async () => {
      return filterMitzvahLog({ user_id: currentUser.id }, '-created_date', 50);
    },
    enabled: !!currentUser,
    staleTime: 300000,
    gcTime: 600000,
    retry: 0
  });

  const { data: userStreak = null } = useQuery({
    queryKey: ['user-streak', currentUser?.id],
    queryFn: async () => {
      const existing = await filterUserStreak({ user_id: currentUser.id });
      if (existing.length > 0) return existing[0];
      return null;
    },
    enabled: !!currentUser,
    staleTime: 1800000,
    gcTime: 2400000,
    retry: 0
  });

  const totalHours = mitzvahLogs.reduce((sum, log) => sum + (log.hours_completed || 0), 0);

  const handleLogSubmit = async ({ title, description, hoursCompleted, community, date }) => {
    try {
      await createMitzvahLog({
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        description: title || description,
        hours_completed: parseFloat(hoursCompleted) || 0,
        community_id: community || null,
        date: date || format(new Date(), 'yyyy-MM-dd'),
        category: 'logged'
      });

      queryClient.invalidateQueries({ queryKey: ['mitzvah-logs'] });
      queryClient.invalidateQueries({ queryKey: ['user-streak'] });
      toast.success('Mitzvah logged! 💜');
      setShowLogModal(false);
    } catch (error) {
      toast.error('Failed to log mitzvah');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Stats Section */}
      <div className="bg-white border-b border-[#E8ECF4]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-4">Your Mitzvah Log</h2>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[12px] border border-purple-200 p-3">
              <p className="text-[11px] text-slate-600 font-semibold mb-1">Current Streak</p>
              <p className="text-[24px] font-bold text-purple-600">{userStreak?.current_streak || 0}</p>
              <p className="text-[10px] text-slate-500 mt-1">days</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[12px] border border-blue-200 p-3">
              <p className="text-[11px] text-slate-600 font-semibold mb-1">Total Completed</p>
              <p className="text-[24px] font-bold text-blue-600">{mitzvahLogs.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">mitzvahs</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[12px] border border-green-200 p-3">
              <p className="text-[11px] text-slate-600 font-semibold mb-1">Total Hours</p>
              <p className="text-[24px] font-bold text-green-600">{totalHours}</p>
              <p className="text-[10px] text-slate-500 mt-1">hours</p>
            </div>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log a Mitzvah
          </button>
        </div>
      </div>

      {/* Mitzvah Log List */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {mitzvahLogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[16px] border border-[#EAECF0]">
              <div className="text-[40px] mb-3">📝</div>
              <p className="text-[14px] font-semibold text-slate-900">No mitzvahs logged yet</p>
              <p className="text-[12px] text-slate-500 mt-1">Start logging your community service</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mitzvahLogs.map(log => (
                <div key={log.id} className="bg-white rounded-[12px] border border-[#EAECF0] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-slate-900">{log.description}</p>
                      {log.hours_completed > 0 && (
                        <p className="text-[12px] text-slate-600 mt-1">{log.hours_completed} hour{log.hours_completed !== 1 ? 's' : ''}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2">{log.date || format(new Date(log.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogNewMitzvahModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        onSubmit={handleLogSubmit}
      />
    </div>
  );
}