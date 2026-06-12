// DEFERRED: no backing table — do not use in beta
import React, { useState, useEffect } from 'react';
import { FileText, Link, Upload, ExternalLink, Download, Loader2, X } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import FileUploadZone from '@/components/common/FileUploadZone';

export default function GroupResourcesTab({ group, currentUser, isMember, isAdmin }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', description: '', category: 'General' });
  const [selectedFile, setSelectedFile] = useState(null);

  const CATEGORIES = ['General', 'Documents', 'Templates', 'Links', 'Media'];

  useEffect(() => {
    loadResources();
  }, [group.id]);

  const loadResources = async () => {
    setLoading(true);
    const items = await dataService.entities.GroupResource.filter({ group_id: group.id }, '-created_date', 50);
    setResources(items);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!newResource.title.trim() || (!selectedFile && !newResource.link_url)) {
      toast.error('Please add a file or link');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (selectedFile) {
        const uploadResult = await dataService.integrations.Core.UploadFile({ file: selectedFile });
        fileUrl = uploadResult.file_url;
        fileName = selectedFile.name;
      }

      const resource = await dataService.entities.GroupResource.create({
        group_id: group.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        title: newResource.title.trim(),
        description: newResource.description?.trim() || undefined,
        category: newResource.category,
        file_url: fileUrl,
        file_name: fileName,
        link_url: newResource.link_url?.trim() || undefined,
        resource_type: selectedFile ? 'file' : 'link',
      });

      setResources(prev => [resource, ...prev]);
      setNewResource({ title: '', description: '', category: 'General' });
      setSelectedFile(null);
      setShowUpload(false);
      toast.success('Resource added!');
    } catch (error) {
      toast.error('Failed to upload');
    }
    setUploading(false);
  };

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-[15px] font-bold text-slate-700 mb-2">Members Only</p>
        <p className="text-[13px] text-slate-500 max-w-sm">Join this community to access member-only resources and content.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Upload Button */}
      {isAdmin && (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full flex items-center gap-3 bg-white border border-dashed border-[#2563EB] rounded-2xl p-4 text-left transition-colors hover:bg-blue-50 active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Upload className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#2563EB]">Add Resource</p>
            <p className="text-[11px] text-slate-400">Share files, documents, or links</p>
          </div>
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-[14px] font-semibold text-slate-700">No resources yet</p>
          <p className="text-[12px] text-slate-400 mt-1">{isAdmin ? 'Add the first resource!' : 'Resources will appear here'}</p>
        </div>
      ) : (
        <>
          {CATEGORIES.map(cat => {
            const catResources = resources.filter(r => r.category === cat);
            if (catResources.length === 0) return null;
            return (
              <section key={cat}>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">{cat}</p>
                <div className="space-y-2">
                  {catResources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-bold text-slate-900">Add Resource</h2>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Title *</label>
                  <input
                    value={newResource.title}
                    onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Community Guidelines"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={newResource.category}
                    onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB]"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Description</label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Brief description..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-600 block mb-2">Upload File</label>
                  <FileUploadZone
                    onFilesUpload={(files) => setSelectedFile(files[0])}
                    maxFiles={1}
                    acceptedTypes="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-slate-700 truncate flex-1">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or add a link</span>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">External Link</label>
                  <input
                    value={newResource.link_url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading || !newResource.title.trim()}
                  className="w-full py-3.5 rounded-2xl font-bold text-[14px] text-white disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: '#2563EB' }}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Resource'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }) {
  const isLink = resource.resource_type === 'link';
  const Icon = isLink ? Link : FileText;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex gap-3 hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#2563EB]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[13px] text-slate-900 truncate">{resource.title}</h4>
        {resource.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{resource.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-slate-400">{resource.user_name}</span>
          <span className="text-[10px] text-slate-300">·</span>
          <span className="text-[10px] text-slate-400">{formatDistanceToNow(parseISO(resource.created_date), { addSuffix: true })}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        {isLink ? (
          <a
            href={resource.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <a
            href={resource.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={resource.file_name}
            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
