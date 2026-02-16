import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function WeeklyScheduleWidget({ shulId }) {
  const { data: schedules = [] } = useQuery({
    queryKey: ['shul-schedule', shulId],
    queryFn: async () => {
      return await base44.entities.ShulSchedule.filter({ shul_id: shulId, is_active: true });
    }
  });

  const getSchedulesByType = (type) => {
    return schedules.filter(s => s.type === type).sort((a, b) => {
      const order = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'shabbat', 'weekday', 'daily'];
      return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
    });
  };

  const ScheduleList = ({ items }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No schedule items yet</p>
      ) : (
        items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                {item.rabbi_or_leader && (
                  <p className="text-xs text-slate-600 mt-0.5">{item.rabbi_or_leader}</p>
                )}
                {item.location && (
                  <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">{item.time}</p>
                <Badge variant="outline" className="mt-1 text-xs capitalize">
                  {item.day_of_week}
                </Badge>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="davening" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="davening">Davening</TabsTrigger>
            <TabsTrigger value="shiur">Shiurim</TabsTrigger>
            <TabsTrigger value="youth">Youth</TabsTrigger>
          </TabsList>
          <TabsContent value="davening" className="mt-3">
            <ScheduleList items={getSchedulesByType('davening')} />
          </TabsContent>
          <TabsContent value="shiur" className="mt-3">
            <ScheduleList items={getSchedulesByType('shiur')} />
          </TabsContent>
          <TabsContent value="youth" className="mt-3">
            <ScheduleList items={getSchedulesByType('youth')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}