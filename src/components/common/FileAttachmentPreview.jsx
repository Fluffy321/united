import React, { useState } from 'react';
import { FileText, Download, X, ZoomIn } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type) {
  return type?.startsWith('image/');
}

/** Inline preview shown inside chat bubble or post card */
export function AttachmentPreview({ attachment, compact = false }) {
  const [lightbox, setLightbox] = useState(false);

  if (!attachment?.url) return null;

  if (isImage(attachment.type)) {
    return (
      <>
        <div
          className={`relative cursor-pointer rounded-xl overflow-hidden border border-white/20 ${compact ? 'max-w-[200px]' : 'max-w-[280px]'}`}
          onClick={() => setLightbox(true)}
        >
          <img src={attachment.url} alt={attachment.name} className="w-full object-cover max-h-52" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </div>
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(false)}>
              <X className="w-7 h-7" />
            </button>
            <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        )}
      </>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors max-w-[240px]"
    >
      <FileText className="w-5 h-5 flex-shrink-0 opacity-80" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{attachment.name}</p>
        {attachment.size && <p className="text-[11px] opacity-60">{formatBytes(attachment.size)}</p>}
      </div>
      <Download className="w-4 h-4 flex-shrink-0 opacity-70" />
    </a>
  );
}

/** Pending attachment chip shown above the input before sending */
export function PendingAttachmentChip({ attachment, onRemove }) {
  if (!attachment) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl max-w-xs">
      {isImage(attachment.type)
        ? <img src={attachment.url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        : <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
      }
      <span className="text-[13px] text-slate-700 truncate flex-1">{attachment.name}</span>
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}