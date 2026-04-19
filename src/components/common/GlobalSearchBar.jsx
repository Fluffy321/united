import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearchBar({ placeholder = 'Search posts, people, communities…' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/search')}
      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-[14px] text-slate-400 text-left"
    >
      <Search className="w-4 h-4 flex-shrink-0" />
      <span>{placeholder}</span>
    </button>
  );
}