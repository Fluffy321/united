import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, CheckCircle2, ChevronRight, Search, Plus, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

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

  const filteredShuls = shuls.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.town?.toLowerCase().includes(q);
  });

  const discoverShuls = filteredShuls.filter(s => !myShulIds.has(s.id));

  const handleShulClick = (shul) => {
    navigate(createPageUrl('ShulPage') + `?shulId=${shul.id}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#E6F0FF] to-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
              <p className="text-sm" style={{ color: '#5F6B7A' }}>Connect with your local kehillah</p>
            </div>
            {currentUser.role === 'admin' && (
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-[#0F5ED7] hover:bg-[#0D4EB8] rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your shul or school..."
              className="pl-9 bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* My Communities */}
        {!search && myShuls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">My Communities</h2>
            <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden">
              {myShuls.map(shul => (
                <ShulCard key={shul.id} shul={shul} onClick={() => handleShulClick(shul)} joined />
              ))}
            </div>
          </div>
        )}

        {/* Discover */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {search ? `Results for "${search}"` : myShuls.length > 0 ? 'Discover More' : 'All Communities'}
          </h2>

          {discoverShuls.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-3xl mb-3">🕍</p>
              <p className="font-semibold text-slate-900 mb-1">
                {search ? 'No communities found' : 'No communities yet'}
              </p>
              <p className="text-sm text-slate-500">
                {search ? 'Try a different search' : 'Communities will appear here soon'}
              </p>
            </div>
          ) : (
            <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden">
              {discoverShuls.map(shul => (
                <ShulCard key={shul.id} shul={shul} onClick={() => handleShulClick(shul)} />
              ))}
            </div>
          )}
        </div>

        {/* Admin seed button */}
        {currentUser.role === 'admin' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-900 mb-2 font-medium">⚙️ Admin Tools</p>
            <Button
              onClick={async () => {
                try {
                  const { data } = await base44.functions.invoke('seedYoungIsrael');
                  if (data.ok && data.shulId) {
                    await queryClient.invalidateQueries({ queryKey: ['shuls'] });
                    await queryClient.invalidateQueries({ queryKey: ['my-shul-memberships'] });
                    toast.success(data.alreadySeeded ? 'Already exists' : 'Young Israel seeded!');
                    navigate(createPageUrl('ShulPage') + `?shulId=${data.shulId}`);
                  } else {
                    toast.error(data.error || 'Failed');
                  }
                } catch (e) {
                  toast.error(e.message);
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

      {/* Create Community Modal (Admin) */}
      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentUser={currentUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['shuls'] });
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

function ShulCard({ shul, onClick, joined }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#E6F0FF] flex items-center justify-center text-[#0F5ED7] font-bold text-lg flex-shrink-0">
          {shul.logo_url ? (
            <img src={shul.logo_url} alt={shul.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            shul.name?.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-slate-900 truncate">{shul.name}</h3>
            {shul.verified && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            {joined && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">Joined</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shul.town}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{shul.member_count || 0} members</span>
          </div>
          {shul.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{shul.description}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
      </div>
    </div>
  );
}

function CreateCommunityModal({ open, onOpenChange, currentUser, onSuccess }) {
  const [name, setName] = useState('');
  const [town, setTown] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !town.trim()) {
      toast.error('Name and town are required');
      return;
    }
    setSubmitting(true);
    try {
      const newShul = await base44.entities.Shul.create({
        name: name.trim(),
        town: town.trim(),
        description: description.trim(),
        address: address.trim(),
        verified: true,
        member_count: 1
      });
      await base44.entities.ShulMember.create({
        shul_id: newShul.id,
        shul_name: newShul.name,
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        role: 'admin'
      });
      toast.success(`${name} created!`);
      setName(''); setTown(''); setDescription(''); setAddress('');
      onSuccess();
    } catch (e) {
      toast.error('Failed to create community');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Community Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Young Israel of Lawrence" className="mt-1" />
          </div>
          <div>
            <Label>Town *</Label>
            <Input value={town} onChange={e => setTown(e.target.value)} placeholder="e.g., Lawrence" className="mt-1" />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1 bg-[#0F5ED7] hover:bg-[#0D4EB8]" onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Community'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}