import { ChevronDown } from 'lucide-react';
import LocationNetworkPicker from '@/components/feed/LocationNetworkPicker';

export function FeedFilterTrigger({ primaryNetwork, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="app-chip app-chip-active min-h-[44px] min-w-0 border-blue-200 bg-blue-50 shadow-sm touch-manipulation active:scale-95"
    >
      <span>{primaryNetwork.emoji}</span>
      <span className="truncate">{primaryNetwork.shortLabel}</span>
      <ChevronDown
        className="w-3 h-3 shrink-0 text-blue-400 transition-transform"
        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </button>
  );
}

export default function FeedFilters({
  isOpen,
  primaryNetwork,
  selectedNeighborhood,
  onSelectNetwork,
  onSelectNeighborhood,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="sticky top-[78px] z-20">
      <LocationNetworkPicker
        currentNetwork={primaryNetwork}
        onSelect={onSelectNetwork}
        onClose={onClose}
      />
      {primaryNetwork.neighborhoods.length > 1 && (
        <div className="bg-white border-b border-slate-100 shadow-sm">
          <div className="mobile-page px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => onSelectNeighborhood('All')}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${selectedNeighborhood === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              All
            </button>
            {primaryNetwork.neighborhoods.map(nb => (
              <button
                key={nb}
                onClick={() => onSelectNeighborhood(nb)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${selectedNeighborhood === nb ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {nb}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
