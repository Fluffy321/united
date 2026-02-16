import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MapPin, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const { data: shuls = [] } = useQuery({
    queryKey: ['shuls'],
    queryFn: () => base44.entities.Shul.list('-created_date')
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-shul-memberships', currentUser?.id],
    queryFn: () => base44.entities.ShulMember.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const myShulIds = new Set(myMemberships.map(m => m.shul_id));
  const myShuls = shuls.filter(s => myShulIds.has(s.id));
  const otherShuls = shuls.filter(s => !myShulIds.has(s.id));

  const handleShulClick = (shul) => {
    navigate(createPageUrl('ShulPage') + `?shulId=${shul.id}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Communities</h1>
          <p className="text-sm text-slate-600">Connect with your local kehillah</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* My Communities */}
        {myShuls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">My Communities</h2>
            <div className="space-y-3">
              {myShuls.map(shul => (
                <div
                  key={shul.id}
                  onClick={() => handleShulClick(shul)}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#0F5ED7] transition-all cursor-pointer"
                  style={{ boxShadow: '0 2px 8px rgba(15, 94, 215, 0.08)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{shul.name}</h3>
                        {shul.verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shul.town}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {shul.member_count || 0}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Communities */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {myShuls.length > 0 ? 'Discover More' : 'All Communities'}
          </h2>
          <div className="space-y-3">
            {otherShuls.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No communities yet
              </div>
            ) : (
              otherShuls.map(shul => (
                <div
                  key={shul.id}
                  onClick={() => handleShulClick(shul)}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#0F5ED7] transition-all cursor-pointer"
                  style={{ boxShadow: '0 2px 8px rgba(15, 94, 215, 0.08)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{shul.name}</h3>
                        {shul.verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      {shul.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-1">{shul.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shul.town}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {shul.member_count || 0} members
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 mb-2 font-medium">Admin Actions</p>
            <Button
              onClick={async () => {
                try {
                  const { data } = await base44.functions.invoke('seedYoungIsrael');
                  console.log('Seed response:', data);
                  
                  if (data.ok && data.shulId) {
                    // Refresh queries and auto-navigate to the new shul
                    await queryClient.invalidateQueries({ queryKey: ['shuls'] });
                    await queryClient.invalidateQueries({ queryKey: ['my-shul-memberships'] });
                    
                    if (data.alreadySeeded) {
                      toast.info('Young Israel of Woodmere already exists');
                    } else {
                      toast.success('Young Israel of Woodmere seeded!');
                    }
                    
                    navigate(createPageUrl('ShulPage') + `?shulId=${data.shulId}`);
                  } else {
                    toast.error(data.error || 'Seeding failed');
                    console.error('Seed error details:', data);
                  }
                } catch (error) {
                  console.error('Seed invocation error:', error);
                  toast.error(`Seeding failed: ${error.message}`);
                }
              }}
              size="sm"
              variant="outline"
            >
              Seed Young Israel of Woodmere
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}