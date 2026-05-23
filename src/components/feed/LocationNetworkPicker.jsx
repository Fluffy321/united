import React from 'react';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { MapPin, Check } from 'lucide-react';

export default function LocationNetworkPicker({ currentNetwork, onSelect, onClose }) {
  const byRegion = LOCAL_NETWORKS.reduce((acc, n) => {
    if (!acc[n.region]) acc[n.region] = [];
    acc[n.region].push(n);
    return acc;
  }, {});

  return (
    <div className="bg-white border-b border-slate-100 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Choose Five Towns Area
        </p>
        {Object.entries(byRegion).map(([region, networks]) => (
          <div key={region} className="mb-2">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">{region}</p>
            <div className="flex flex-wrap gap-2">
              {networks.map(n => {
                const isActive = currentNetwork?.id === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => { onSelect(n); onClose(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{n.emoji}</span>
                    <span>{n.shortLabel}</span>
                    {isActive && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
