import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ChalkboardCard from '@/components/chalkboard/ChalkboardCard';
import EventCard from '@/components/chalkboard/EventCard';
import CreateChalkboardModal from '@/components/chalkboard/CreateChalkboardModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const boards = [
  { value: 'all', label: '🔖 All', color: 'bg-slate-100 text-slate-700', desc: 'View all community boards' },
  { value: 'help_needed', label: '🆘 Help', color: 'bg-red-100 text-red-700', desc: 'Ask for advice or support (anonymous allowed)' },
  { value: 'events', label: '📅 Events', color: 'bg-blue-100 text-blue-700', desc: 'Community gatherings & activities' },
  { value: 'dating', label: '💕 Dating', color: 'bg-pink-100 text-pink-700', ageRestricted: true, desc: '18+ only. Respectful connections.' },
  { value: 'jobs', label: '💼 Jobs', color: 'bg-green-100 text-green-700', desc: 'Local work & opportunities' },
  { value: 'roommates', label: '🏠 Housing', color: 'bg-amber-100 text-amber-700', desc: 'Find roommates & housing' },
  { value: 'kosher_food', label: '🍽️ Food', color: 'bg-purple-100 text-purple-700', desc: 'Kosher dining recommendations' }
];

export default function Chalkboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const isUnder18 = currentUser?.age_range === '13-17';
  const filteredBoards = boards.filter(b => {
    if (b.ageRestricted && isUnder18) return false;
    return true;
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['chalkboard', selectedBoard],
    queryFn: async () => {
      if (selectedBoard === 'all') {
        const allPosts = await base44.entities.ChalkboardPost.list('-created_date', 50);
        // Filter out dating posts for under 18
        if (isUnder18) {
          return allPosts.filter(p => p.board_type !== 'dating');
        }
        return allPosts;
      }
      return base44.entities.ChalkboardPost.filter({ board_type: selectedBoard }, '-created_date', 50);
    },
    enabled: !!currentUser
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChalkboardPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chalkboard'] });
      toast.success('Post deleted');
    }
  });

  const handleMessage = async (userId, userName) => {
    // Check for existing conversation
    const conversations = await base44.entities.Conversation.list();
    const existing = conversations.find(c => 
      c.participant_ids?.includes(currentUser.id) && c.participant_ids?.includes(userId)
    );

    if (existing) {
      navigate(createPageUrl('Messages') + `?conversation=${existing.id}`);
    } else {
      // Create new conversation
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, userId],
        participant_names: [
          currentUser.display_name || currentUser.full_name?.split(' ')[0],
          userName
        ],
        participant_ages: [currentUser.age_range || '18+', '18+'],
        unread_count: {}
      });
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    }
  };

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Chalkboard</h1>
          <p className="text-slate-500 text-sm mt-1">Local boards for the community</p>
        </div>

        {/* Board Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {filteredBoards.map(board => (
              <Badge 
                key={board.value}
                variant="outline"
                className={`cursor-pointer whitespace-nowrap transition-all py-2 px-4 text-sm ${
                  selectedBoard === board.value 
                    ? `${board.color} border-transparent` 
                    : 'bg-white hover:bg-slate-100'
                }`}
                onClick={() => setSelectedBoard(board.value)}
              >
                {board.label}
              </Badge>
            ))}
          </div>
          {selectedBoard && (
            <p className="text-xs text-slate-500 mt-2 px-1">
              {filteredBoards.find(b => b.value === selectedBoard)?.desc}
            </p>
          )}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-slate-600 font-medium">No posts in this board</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              post.board_type === 'events' ? (
                <EventCard
                  key={post.id}
                  event={post}
                  currentUser={currentUser}
                  onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onReport={handleReport}
                />
              ) : (
                <ChalkboardCard 
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                  onMessage={handleMessage}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onReport={handleReport}
                />
              )
            ))}
          </div>
        )}

        {/* Create Post FAB */}
        <Button 
          size="lg"
          className="fixed bottom-24 right-6 rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setShowCreatePost(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <CreateChalkboardModal 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost}
        currentUser={currentUser}
        defaultBoard={selectedBoard !== 'all' ? selectedBoard : ''}
        onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['chalkboard'] })}
      />

      <CommentsSheet 
        open={showComments}
        onOpenChange={setShowComments}
        post={selectedPost}
        currentUser={currentUser}
        onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['chalkboard'] })}
      />

      <ReportModal 
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />
    </div>
  );
}