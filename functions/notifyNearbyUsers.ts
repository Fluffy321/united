import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calculate distance between two coordinates in miles
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requestId, requestTitle, locationLabel, lat, lng } = await req.json();

    if (!lat || !lng) {
      return Response.json({ error: 'Location required' }, { status: 400 });
    }

    // Get all users with location set
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithLocation = allUsers.filter(u => u.location_lat && u.location_lng);

    // Find users within 10 miles
    const nearbyUsers = usersWithLocation.filter(user => {
      const distance = calculateDistance(lat, lng, user.location_lat, user.location_lng);
      return distance <= 10;
    });

    // Send notifications to nearby users
    for (const user of nearbyUsers) {
      try {
        await base44.asServiceRole.functions.invoke('sendMitzvahNotification', {
          type: 'nearby_request',
          recipientId: user.id,
          requestTitle,
          locationLabel
        });
      } catch (error) {
        console.error(`Failed to notify user ${user.id}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      notified: nearbyUsers.length 
    });
  } catch (error) {
    console.error('Nearby notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});