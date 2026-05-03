import React, { useState, useEffect } from 'react';
import { Loader2, MapPin, CheckCircle, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import EventCard from '@/components/chalkboard/EventCard';
import PostCard from '@/components/feed/PostCard';

const orgTypeConfig = {
  shul: { icon: '🕍', color: 'bg-blue-100 text-blue-700' },
  school: { icon: '🎓', color: 'bg-green-100 text-green-700' },
  youth_group: { icon: '👥', color: 'bg-purple-100 text-purple-700' },
  restaurant: { icon: '🍽️', color: 'bg-orange-100 text-orange-700' }
};

export default function Organization() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    const params = new URLSearchParams(window.location.search);
    setOrgId(params.get('id'));
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const { data: org } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0];
    },
    enabled: !!orgId
  });

  const { data: events = [] } = useQuery({
    queryKey: ['org-events', orgId],
    queryFn: () => base44.entities.ChalkboardPost.filter({ 
      organization_id: orgId,
      board_type: 'events'
    }, '-created_date', 20),
    enabled: !!orgId
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['org-posts', orgId],
    queryFn: () => base44.entities.Post.filter({ 
      organization_id: orgId
    }, '-created_date', 20),
    enabled: !!orgId
  });

  if (!currentUser || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const typeConfig = orgTypeConfig[org.type] || orgTypeConfig.shul;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-4 py-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{typeConfig.icon}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{org.name}</h1>
                  {org.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                
                <Badge className={`${typeConfig.color} mb-2`}>
                  {typeConfig.icon} {org.type.replace('_', ' ')}
                </Badge>

                {org.location && (
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{org.location}</span>
                  </div>
                )}
              </div>
            </div>

            {org.description && (
              <p className="text-slate-600 mt-4 leading-relaxed">{org.description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="events">
                <Calendar className="w-4 h-4 mr-2" />
                Events ({events.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                <MessageSquare className="w-4 h-4 mr-2" />
                Posts ({posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No events yet</p>
                </div>
              ) : (
                events.map(event => (
                  <EventCard 
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    onComment={() => {}}
                    onDelete={() => {}}
                    onReport={() => {}}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No posts yet</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard 
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    liked={false}
                    onLike={() => {}}
                    onComment={() => {}}
                    onRepost={() => {}}
                    onDelete={() => {}}
                    onReport={() => {}}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}