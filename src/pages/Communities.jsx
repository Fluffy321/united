import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MapPin, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

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
    navigate(createPageUrl('ShulPage') + `?id=${shul.id}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Communities</h1>

        {/* My Communities */}
        {myShuls.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">My Communities</h2>
            <div className="space-y-2">
              {myShuls.map(shul => (
                <div
                  key={shul.id}
                  onClick={() => handleShulClick(shul)}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
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
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {myShuls.length > 0 ? 'Discover More' : 'All Communities'}
          </h2>
          <div className="space-y-2">
            {otherShuls.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No communities yet
              </div>
            ) : (
              otherShuls.map(shul => (
                <div
                  key={shul.id}
                  onClick={() => handleShulClick(shul)}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
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
                const { data } = await base44.functions.invoke('seedYoungIsrael');
                if (data.success) {
                  window.location.reload();
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