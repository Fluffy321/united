import React, { useState } from 'react';
import { FileText, Link as LinkIcon, Upload, Plus, Trash2, Download, ExternalLink, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import UserAvatar from '@/components/common/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

const RESOURCE_TYPES = [
  { id: 'document', label: '📄 Document', icon: FileText },
  { id: 'template', label: '📋 Template', icon: FileText },
  { id: 'link', label: '🔗 Link', icon: LinkIcon },
];

const CATEGORIES = ['Budget', 'Guidelines', 'Templates', 'Forms', 'FAQs', 'Other'];

export default function CommunityResourceLibrary({ communityId, currentUser, isAdmin }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [resourceType, setResourceType] = useState('link');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['community-resources', communityId],
    queryFn: () => base44.entities.CommunityResource.filter(
      { community_id: communityId },
      '-created_date',
      50
    ),
    enabled: !!communityId,
  });

  const deleteMutation = useMutation({
    mutationFn: (resourceId) => base44.entities.CommunityResource.delete(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-resources', communityId] });
      toast.success('Resource deleted');
    },
  });

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (resourceType !== 'link' && file) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploadRes.file_url;
        fileName = file.name;
      }

      await base44.entities.CommunityResource.create({
        community_id: communityId,
        title: title.trim(),
        description: description.trim(),
        resource_type: resourceType,
        file_url: fileUrl,
        link_url: resourceType === 'link' ? linkUrl.trim() : null,
        uploaded_by_id: currentUser.id,
        uploaded_by_name: currentUser.display_name || currentUser.full_name,
        file_name: fileName,
        category: category || null,
      });

      setTitle('');
      setDescription('');
      setLinkUrl('');
      setFile(null);
      setCategory('');
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['community-resources', communityId] });
      toast.success('Resource added!');
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
    } finally {
      setUploading(false);
    }
  };

  const groupedResources = resources.reduce((acc, res) => {
    const cat = res.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(res);
    return acc;
  }, {});

  const categories = Object.keys(groupedResources).sort();

  return (
    <div className="space-y-4 pt-4">
      {/* Add Resource Button */}
      {currentUser && (
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 font-semibold text-[13px] rounded-lg border border-blue-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      )}

      {/* Add Resource Form */}
      {showAddForm && (
        <form onSubmit={handleAddResource} className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Resource Type</label>
            <div className="flex gap-2">
              {RESOURCE_TYPES.map(rt => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => { setResourceType(rt.id); setFile(null); setLinkUrl(''); }}
                  className={`flex-1 px-3 py-2 rounded text-[12px] font-medium transition-colors ${
                    resourceType === rt.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this resource about?"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {resourceType === 'link' ? (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">URL *</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-[13px]"
              />
              {file && <p className="text-[11px] text-slate-500 mt-1">Selected: {file.name}</p>}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : 'Add Resource'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-3 space-y-1">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-2 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-slate-100">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-slate-600">No resources yet</p>
          <p className="text-[12px] text-slate-400 mt-1">Start sharing documents, templates, and links</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide px-3 mb-2">{cat}</h3>
              <div className="space-y-2">
                {groupedResources[cat].map(resource => (
                  <div key={resource.id} className="bg-white rounded-lg border border-slate-100 p-3 hover:border-blue-200 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {resource.resource_type === 'link' ? (
                          <LinkIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-slate-900 break-words">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{resource.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <UserAvatar name={resource.uploaded_by_name} size="xs" />
                          <span>{resource.uploaded_by_name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(resource.created_date), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {resource.resource_type === 'link' ? (
                          <a
                            href={resource.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        ) : (
                          <a
                            href={resource.file_url}
                            download
                            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </a>
                        )}
                        {(isAdmin || currentUser?.id === resource.uploaded_by_id) && (
                          <button
                            onClick={() => deleteMutation.mutate(resource.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete resource"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}