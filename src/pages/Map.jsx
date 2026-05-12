import React, { useRef } from 'react';
import { MapPin } from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import MitzvahMapView from '@/components/mitzvah/MitzvahMapView';

export default function MapPage() {
  const mapRef = useRef(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['mitzvah-requests-map'],
    queryFn: () => dataService.entities.MitzvahRequest.list('-created_date', 100),
    staleTime: 120000,
  });

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
        }
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
        </div>

        {/* Map fills the viewport height minus header and nav */}
        <div
          className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
          style={{ height: 'calc(100dvh - 200px)' }}
        >
          <MitzvahMapView
            ref={mapRef}
            requests={requests}
            onUseMyLocation={handleUseMyLocation}
          />
        </div>
      </div>
    </main>
  );
}
