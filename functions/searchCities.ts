import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return Response.json({ cities: [] });
    }

    // Use Nominatim API (OpenStreetMap) for city search
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '10',
      'accept-language': 'en',
      featuretype: 'city'
    });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'United Community App'
      }
    });

    const data = await response.json();

    // Filter and format results to only show cities
    const cities = data
      .filter(item => {
        const type = item.type || item.class;
        return type === 'city' || type === 'town' || type === 'village' || 
               (item.address && (item.address.city || item.address.town || item.address.village));
      })
      .map(item => {
        const city = item.address?.city || item.address?.town || item.address?.village || item.name;
        const state = item.address?.state || '';
        const country = item.address?.country || '';
        
        return {
          city,
          state,
          country,
          display: state ? `${city}, ${state}` : `${city}, ${country}`
        };
      })
      .filter((item, index, self) => 
        // Remove duplicates
        index === self.findIndex(t => t.city === item.city && t.state === item.state)
      )
      .slice(0, 8);

    return Response.json({ cities });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});