import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InterestsSection({ interests, onAddInterest }) {
  const navigate = useNavigate();

  if (!interests || interests.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Interests</p>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, i) => (
            <button
              key={i}
              onClick={() => navigate(createPageUrl('Feed') + `?interest=${encodeURIComponent(interest)}`)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              {interest}
            </button>
          ))}
          <button
            onClick={onAddInterest}
            className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}