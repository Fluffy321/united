import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataService } from '@/services';
import { captureError } from '@/lib/analytics';

const FIVE_TOWNS = ['Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood'];

export default function CitySelector({ cityPreset, cityCustom, cityState, onChange }) {
  const [mode, setMode] = useState(cityPreset ? 'preset' : (cityCustom ? 'custom' : 'preset'));
  const [searchQuery, setSearchQuery] = useState(cityCustom || '');
  const [cities, setCities] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (mode === 'custom' && searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await dataService.functions.invoke('searchCities', { query: searchQuery });
          setCities(response.data.cities || []);
          setShowDropdown(true);
        } catch (error) {
          captureError(error, { context: 'CitySelector: search cities' });
          setCities([]);
        }
        setIsSearching(false);
      }, 300);
    } else {
      setCities([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, mode]);

  const handlePresetChange = (value) => {
    if (value === 'other') {
      setMode('custom');
      setSearchQuery('');
      onChange({ cityPreset: null, cityCustom: null, cityState: null });
    } else {
      setMode('preset');
      onChange({ cityPreset: value, cityCustom: null, cityState: null });
    }
  };

  const handleCitySelect = (city) => {
    setSearchQuery(city.city);
    onChange({ cityPreset: null, cityCustom: city.city, cityState: city.state });
    setShowDropdown(false);
    setCities([]);
  };

  const displayValue = cityPreset || (cityCustom && cityState ? `${cityCustom}, ${cityState}` : cityCustom);

  return (
    <div className="space-y-3">
      <div>
        <Label>City</Label>
        <Select 
          value={mode === 'preset' ? (cityPreset || FIVE_TOWNS[0]) : 'other'} 
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIVE_TOWNS.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'custom' && (
        <div className="relative">
          <Label>Type your city</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing city name..."
              className="pl-9 pr-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {showDropdown && cities.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
              {cities.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-slate-900">{city.display}</span>
                  {cityCustom === city.city && cityState === city.state && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {showDropdown && cities.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg p-3">
              <p className="text-sm text-slate-500">No cities found. Try a different search.</p>
            </div>
          )}
        </div>
      )}


    </div>
  );
}