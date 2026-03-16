import React, { useRef, useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ALLOWED_TYPES = {
  'image/jpeg': true, 'image/png': true, 'image/gif': true, 'image/webp': true,
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'text/plain': true,
};
const MAX_SIZE_MB = 10;

export default function FileAttachmentButton({ onAttached, className = '' }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_TYPES[file.type]) {
      toast.error('File type not supported. Allowed: images, PDF, Word, TXT.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onAttached({ url: file_url, name: file.name, type: file.type, size: file.size });
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 flex-shrink-0 ${className}`}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </button>
    </>
  );
}