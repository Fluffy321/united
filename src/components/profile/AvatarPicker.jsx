import React from 'react';
import { AVATAR_PRESETS } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';

export default function AvatarPicker({ selectedPreset, onSelect }) {
  const presets = Object.keys(AVATAR_PRESETS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Choose an avatar</h3>
        {selectedPreset && (
          <Badge variant="outline" className="text-xs">Selected</Badge>
        )}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {presets.map(presetId => {
          const Icon = AVATAR_PRESETS[presetId];
          const isSelected = selectedPreset === presetId;
          
          return (
            <button
              key={presetId}
              onClick={() => onSelect(presetId)}
              className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-6 h-6 text-slate-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
}