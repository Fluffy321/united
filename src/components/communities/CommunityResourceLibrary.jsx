import React, { useState, useRef } from 'react';
import {
  FileText, Link as LinkIcon, Upload, Plus, Trash2, Download,
  ExternalLink, Loader2, Search, X, File, Image, FileSpreadsheet,
  FileVideo, Music, Archive, BookOpen
} from 'lucide-react';
import { dataService } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = ['General', 'Guidelines', 'Forms', 'Templates', 'FAQs', 'Budget', 'Events', 'Calendar', 'Other'];

const TYPE_OPTIONS = [
  { id: 'link', label: 'Link', emoji: '🔗', desc: 'Share a URL' },
  { id: 'document', label: 'Document', emoji: '📄', desc: 'Upload a file' },
];

// Map file extensions to icons + colors
function FileIcon({ fileName, linkUrl, size = 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  if (linkUrl) return <LinkIcon className={`${cls} text-blue-500`} />;
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return <Image className={`${cls} text-pink-500`} />;
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet className={`${cls} text-green-600`} />;
  if (['mp4','mov','avi','mkv'].includes(ext)) return <FileVideo className={`${cls} text-purple-500`} />;
  if (['mp3','wav','ogg'].includes(ext)) return <Music className={`${cls} text-orange-500`} />;
  if (['zip','tar','gz','rar'].includes(ext)) return <Archive className={`${cls} text-yellow-600`} />;
  if (['pdf'].includes(ext)) return <FileText className={`${cls} text-red-500`} />;
  if (['doc','docx'].includes(ext)) return <FileText className={`${cls} text-blue-600`} />;
  if (['ppt','pptx'].includes(ext)) return <BookOpen className={`${cls} text-orange-600`} />;
  return <File className={`${cls} text-slate-500`} />;
}

function FileBgColor({ fileName, linkUrl }) {
  if (linkUrl) return 'bg-blue-50';
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'bg-pink-50';
  if (['xls','xlsx','csv'].includes(ext)) return 'bg-green-50';
  if (['mp4','mov','avi','mkv'].includes(ext)) return 'bg-purple-50';
  if (['pdf'].includes(ext)) return 'bg-red-50';
  if (['doc','docx'].includes(ext)) return 'bg-blue-50';
  return 'bg-slate-100';
}

// ── Add Resource Sheet ────────────────────────────────────────────────────────
function AddResourceSheet({ open, onClose, communityId, currentUser, onAdded }) {
  const [resourceType, setResourceType] = useState('link');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setTitle(''); setDescription(''); setLinkUrl(''); setFile(null);
    setCategory('General'); setResourceType('link');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setResourceType('document'); if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, '')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (resourceType === 'link' && !linkUrl.trim()) { toast.error('URL is required'); return; }
    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;
      if (resourceType === 'document' && file) {
        const res = await dataService.integrations.Core.UploadFile({ file, bucket: 'community-resources' });
        fileUrl = res.file_url;
        fileName = file.name;
      }
      await dataService.entities.CommunityResource.create({
        community_id: communityId,
        title: title.trim(),
        description: description.trim(),
        resource_type: resourceType,
        file_url: fileUrl,
        link_url: resourceType === 'link' ? linkUrl.trim() : null,
        uploaded_by_id: currentUser.id,
        uploaded_by_name: currentUser.display_name || currentUser.full_name,
        file_name: fileName,
        category,
      });
      toast.success('Resource added!');
      reset();
      onAdded();
      onClose();
    } catch {
      toast.error('Failed to add resource');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={handleClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-[17px] font-bold text-slate-900">Add Resource</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh] pb-8">
          {/* Type selector */}
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setResourceType(opt.id); setFile(null); }}
                className={`flex-1 py-3 px-3 rounded-xl border-2 text-center transition-all ${
                  resourceType === opt.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-xl mb-0.5">{opt.emoji}</div>
                <div className="text-[12px] font-bold">{opt.label}</div>
                <div className="text-[10px] opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Parent Handbook 2025"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe what this resource contains…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Link URL / File upload */}
          {resourceType === 'link' ? (
            <div>
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">URL *</label>
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <div>
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">File</label>
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <FileIcon fileName={file.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-slate-600">Drop a file or click to browse</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF, Word, Excel, images, and more</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !title.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-[15px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading…' : 'Add Resource'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, canDelete, onDelete }) {
  const isLink = resource.resource_type === 'link';
  const bgColor = FileBgColor({ fileName: resource.file_name, linkUrl: resource.link_url });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3 hover:border-blue-200 hover:shadow-sm transition-all group">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <FileIcon fileName={resource.file_name} linkUrl={resource.link_url} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[14px] text-slate-900 leading-snug truncate">{resource.title}</h4>
        {resource.description && (
          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{resource.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {resource.category && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
              {resource.category}
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            {resource.uploaded_by_name} · {formatDistanceToNow(new Date(resource.created_date), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLink ? (
          <a
            href={resource.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Open link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <a
            href={resource.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(resource.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CommunityResourceLibrary({ communityId, currentUser, isAdmin }) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['community-resources', communityId],
    queryFn: () => dataService.entities.CommunityResource.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dataService.entities.CommunityResource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-resources', communityId] });
      toast.success('Resource deleted');
    },
  });

  // Derive categories that actually have resources
  const usedCategories = ['All', ...Array.from(new Set(resources.map(r => r.category || 'General'))).sort()];

  const filtered = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || (r.category || 'General') === activeCategory;
    const matchType = activeType === 'all' || r.resource_type === activeType;
    return matchSearch && matchCat && matchType;
  });

  const grouped = filtered.reduce((acc, r) => {
    const cat = r.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4 pt-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>
        {currentUser && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold flex-shrink-0 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: '📚 All' },
          { id: 'document', label: '📄 Files' },
          { id: 'link', label: '🔗 Links' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              activeType === t.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      {usedCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {usedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-bold text-slate-700 text-[15px]">No resources yet</p>
          <p className="text-[13px] text-slate-400 mt-1 mb-4">Share documents, links, and files with your community</p>
          {currentUser && (
            <button
              onClick={() => setShowAddSheet(true)}
              className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-[13px] font-bold"
            >
              Add First Resource
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-[14px]">No resources match your filters.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All'); setActiveType('all'); }} className="text-[13px] text-blue-600 font-semibold mt-2">Clear filters</button>
        </div>
      ) : (
        // If only one category after filtering, show flat list; otherwise group
        Object.keys(grouped).length === 1 ? (
          <div className="space-y-2">
            {filtered.map(r => (
              <ResourceCard
                key={r.id}
                resource={r}
                canDelete={isAdmin || currentUser?.id === r.uploaded_by_id}
                onDelete={id => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.keys(grouped).sort().map(cat => (
              <div key={cat}>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">{cat}</p>
                <div className="space-y-2">
                  {grouped[cat].map(r => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      canDelete={isAdmin || currentUser?.id === r.uploaded_by_id}
                      onDelete={id => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <AddResourceSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        communityId={communityId}
        currentUser={currentUser}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ['community-resources', communityId] })}
      />
    </div>
  );
}
