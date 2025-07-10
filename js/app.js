// --- Sample trip: SF → LA → Vegas → SD
const tripStops = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Los Angeles',   lat: 34.0522, lng: -118.2437 },
  { name: 'Las Vegas',     lat: 36.1699, lng: -115.1398 },
  { name: 'San Diego',     lat: 32.7157, lng: -117.1611 }
];

// Build great-circle arcs between consecutive stops
const arcsData = tripStops.slice(1).map((stop, i) => ({
  startLat: tripStops[i].lat,
  startLng: tripStops[i].lng,
  endLat:   stop.lat,
  endLng:   stop.lng,
  color:    ['cyan', 'cyan']
}));

// Create the globe (bundled build exposes a constructor)
const world = new Globe(document.getElementById('globeViz'))
  .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
  .backgroundColor('#000')
  // Points
  .pointsData(tripStops)
    .pointLat('lat')
    .pointLng('lng')
    .pointAltitude(0.01)
    .pointRadius(0.3)
    .pointColor(() => 'orange')
    .pointLabel('name')
  // Arcs
  .arcsData(arcsData)
    .arcStroke(0.8)
    .arcDashLength(0.4)
    .arcDashGap(4)
    .arcDashAnimateTime(4000);

// Nice initial camera angle
world.pointOfView({ lat: 35, lng: -120, altitude: 2.5 }, 0);
