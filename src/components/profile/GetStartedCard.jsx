import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GetStartedCard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Complete your first acts of chesed</h3>
        <p className="text-sm text-slate-600 mb-4">Log mitzvahs to see your impact here</p>
        <button
          onClick={() => navigate(createPageUrl('MitzvahCircle'))}
          className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Log Mitzvah
        </button>
      </div>
    </div>
  );
}