import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import FileUploadZone from '@/components/common/FileUploadZone';

export default function PostBox({ currentUser, onPostClick }) {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFilesUpload = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-3xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)', padding: '10px', boxShadow: '0 4px 18px rgba(37,99,235,0.1)' }}>
      <div className="bg-white rounded-2xl border border-blue-100/80 p-3.5 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <UserAvatar user={currentUser} size="sm" />
        <button
          onClick={() => onPostClick('feed')}
          className="flex-1 text-left px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-colors bg-slate-50 text-slate-400 border border-slate-100"
        >
          What's happening?
        </button>
        <button
          onClick={() => setShowFileUpload(!showFileUpload)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}
          title="Add photo or file"
        >
          <ImagePlus style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* File upload popover */}
      {showFileUpload && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowFileUpload(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add photos or files</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <FileUploadZone 
              onFilesUpload={handleFilesUpload}
              maxFiles={3}
            />

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Attached ({uploadedFiles.length})</p>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.type?.startsWith('image/') ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                          {file.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <button
                onClick={() => {
                  onPostClick('feed');
                  setShowFileUpload(false);
                }}
                className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Post with files ({uploadedFiles.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}