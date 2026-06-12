// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function MediaTab({ shul, isAdmin, onShulUpdate }) {
  const [uploading, setUploading] = useState(false);
  const bulletins = shul.bulletins || [];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await dataService.integrations.Core.UploadFile({ file });
      const newBulletin = {
        url: file_url,
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        uploaded_at: new Date().toISOString()
      };
      const updatedBulletins = [newBulletin, ...bulletins].slice(0, 20);
      await dataService.entities.Shul.update(shul.id, { bulletins: updatedBulletins });
      onShulUpdate({ ...shul, bulletins: updatedBulletins });
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (index) => {
    const updatedBulletins = bulletins.filter((_, i) => i !== index);
    await dataService.entities.Shul.update(shul.id, { bulletins: updatedBulletins });
    onShulUpdate({ ...shul, bulletins: updatedBulletins });
    toast.success('Removed');
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#0F5ED7] transition-colors">
          <label htmlFor="bulletin-upload" className="cursor-pointer">
            <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-3">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-[#0F5ED7] animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-[#0F5ED7]" />
              )}
            </div>
            <p className="font-semibold text-slate-900 mb-1">
              {uploading ? 'Uploading...' : 'Upload Weekly Bulletin'}
            </p>
            <p className="text-sm text-slate-500">PDF, JPG, or PNG • Max 10MB</p>
          </label>
          <input
            type="file"
            id="bulletin-upload"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {bulletins.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bulletins yet</p>
          {isAdmin && <p className="text-sm mt-1">Upload your weekly bulletin above</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.map((bulletin, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                bulletin.type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                {bulletin.type === 'pdf' ? (
                  <FileText className="w-5 h-5 text-red-500" />
                ) : (
                  <Image className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{bulletin.name}</p>
                <p className="text-xs text-slate-500">
                  {bulletin.uploaded_at
                    ? formatDistanceToNow(new Date(bulletin.uploaded_at), { addSuffix: true })
                    : 'Recently uploaded'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a href={bulletin.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-[#0F5ED7]">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
