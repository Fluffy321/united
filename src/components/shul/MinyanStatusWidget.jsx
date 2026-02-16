import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

const MINYAN_TIMES = {
  shacharis: '7:00 AM',
  mincha: '1:30 PM',
  maariv: '8:00 PM'
};

export default function MinyanStatusWidget({ shulId, currentUser }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: attendance = [] } = useQuery({
    queryKey: ['minyan-attendance', shulId, today],
    queryFn: async () => {
      const all = await base44.entities.MinyanAttendance.filter({ 
        shul_id: shulId, 
        date: today 
      });
      return all;
    }
  });

  const markAttendingMutation = useMutation({
    mutationFn: async ({ minyanType }) => {
      // Check if already marked
      const existing = attendance.find(
        a => a.minyan_type === minyanType && a.user_id === currentUser.id
      );
      
      if (existing) {
        await base44.entities.MinyanAttendance.delete(existing.id);
        return { removed: true };
      } else {
        await base44.entities.MinyanAttendance.create({
          shul_id: shulId,
          date: today,
          minyan_type: minyanType,
          user_id: currentUser.id,
          user_name: currentUser.full_name
        });
        return { removed: false };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['minyan-attendance'] });
      toast.success(data.removed ? 'Marked as not coming' : "Marked as coming!");
    }
  });

  const getMinyanCount = (type) => {
    return attendance.filter(a => a.minyan_type === type).length;
  };

  const isUserComing = (type) => {
    return attendance.some(a => a.minyan_type === type && a.user_id === currentUser?.id);
  };

  const getMinyanStatus = (count) => {
    if (count >= 10) return { text: 'Minyan!', color: 'bg-green-100 text-green-700' };
    if (count >= 7) return { text: `Need ${10 - count} more`, color: 'bg-yellow-100 text-yellow-700' };
    return { text: `Need ${10 - count}`, color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Today's Minyan Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {['shacharis', 'mincha', 'maariv'].map(type => {
          const count = getMinyanCount(type);
          const status = getMinyanStatus(count);
          const userComing = isUserComing(type);

          return (
            <div key={type} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold capitalize">{type}</span>
                  <span className="text-sm text-slate-500">{MINYAN_TIMES[type]}</span>
                </div>
                <Badge className={status.color}>
                  {count}/10 • {status.text}
                </Badge>
              </div>
              <Button
                onClick={() => markAttendingMutation.mutate({ minyanType: type })}
                variant={userComing ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {userComing ? "I'm Coming ✓" : "I'm Coming"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}