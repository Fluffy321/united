import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import MitzvahMap from '@/components/mitzvah/MitzvahMap';

export default function MapPage() {
  const [userLocation, setUserLocation] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['mitzvah-requests-map'],
    queryFn: () => dataService.entities.MitzvahRequest.list('-created_date', 100),
    staleTime: 120000,
  });

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserLocation({ lat, lng });
      },
      () => {}
    );
  };

  return (
    <main className="app-page mobile-safe-bottom">
      <div className="mobile-page-wide px-3 pt-3 pb-6 sm:px-4 sm:pt-4">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
          <h1 className="text-2xl font-black text-slate-950">Map</h1>
          <PageHelp text="Explore Jewish community life around you — shuls, minyanim, chesed needs, and more." />
          <button
            onClick={handleUseMyLocation}
            className="motion-press ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
          >
            <Navigation className="h-3.5 w-3.5" />
            Near me
          </button>
        </div>

        <div className="shadow-sm">
          <MitzvahMap
            requests={requests}
            userLocation={userLocation}
            personalized
          />
        </div>
      </div>
    </main>
  );
}
