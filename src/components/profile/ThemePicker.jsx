import React from 'react';
import { Check } from 'lucide-react';

const THEMES = [
  { id: 'ocean-blue', name: 'Ocean Blue', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'sunset-orange', name: 'Sunset Orange', gradient: 'from-orange-500 to-pink-500' },
  { id: 'purple-glow', name: 'Purple Glow', gradient: 'from-purple-600 to-indigo-500' },
  { id: 'mint-green', name: 'Mint Green', gradient: 'from-green-400 to-emerald-500' },
  { id: 'midnight-dark', name: 'Midnight Dark', gradient: 'from-slate-800 to-slate-600' },
  { id: 'gold-shine', name: 'Gold Shine', gradient: 'from-yellow-500 to-amber-600' },
  { id: 'soft-pink', name: 'Soft Pink', gradient: 'from-pink-400 to-rose-500' },
  { id: 'sky-gradient', name: 'Sky Gradient', gradient: 'from-sky-400 to-blue-500' }
];

export default function ThemePicker({ selectedTheme, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-slate-900">Choose a color theme</h3>
      <div className="grid grid-cols-4 gap-2">
        {THEMES.map(theme => {
          const isSelected = selectedTheme === theme.id;
          
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className="relative group"
            >
              <div className={`aspect-square rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md hover:shadow-lg transition-all flex items-center justify-center ${
                isSelected ? 'ring-4 ring-indigo-600 ring-offset-2' : ''
              }`}>
                {isSelected && (
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                )}
              </div>
              <p className="text-xs text-center mt-1 text-slate-600 font-medium">{theme.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}