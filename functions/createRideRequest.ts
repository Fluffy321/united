import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function distanceInMiles(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { pickupLat, pickupLng, destination, time, urgency, compensation } = await req.json();

  // Create the ride request
  const request = await base44.entities.MitzvahRequest.create({
    title: 'Ride Needed',
    description: `Ride to ${destination}`,
    category: 'Ride',
    status: 'open',
    pickupLat,
    pickupLng,
    destination,
    needed_by: time,
    urgency: urgency ?? 'MEDIUM',
    compensation: compensation ?? 'FREE',
    created_by_user_id: user.id,
    created_by_name: user.full_name,
  });

  // Notify nearby volunteers who have RIDE in their categories
  const volunteers = await base44.asServiceRole.entities.VolunteerProfile.filter({
    active: true,
  });

  const rideVolunteers = volunteers.filter(v =>
    Array.isArray(v.categories) && v.categories.includes('RIDES') &&
    (v.helps_this_week ?? 0) < (v.weekly_limit ?? 2)
  );

  await Promise.allSettled(
    rideVolunteers.map(v =>
      base44.asServiceRole.entities.Notification.create({
        user_id: v.user_id,
        type: 'ride_request',
        message: `New ride request to ${destination}`,
        link: `/MitzvahCircle?request=${request.id}`,
        read: false,
      })
    )
  );

  return Response.json({ request, notified: rideVolunteers.length });
});