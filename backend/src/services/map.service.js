const places = [
  {
    id: 'fushimi-inari',
    name: 'Fushimi Inari',
    category: 'Temple',
    city: 'Kyoto',
    lat: 34.9671,
    lng: 135.7727,
    score: 9.8,
    tags: ['culture', 'budget', 'hanami'],
  },
  {
    id: 'nishiki-market',
    name: 'Nishiki Market',
    category: 'Food',
    city: 'Kyoto',
    lat: 35.005,
    lng: 135.7647,
    score: 9.5,
    tags: ['food', 'ville'],
  },
  {
    id: 'aiguille-midi',
    name: 'Aiguille du Midi',
    category: 'Montagne',
    city: 'Chamonix',
    lat: 45.8789,
    lng: 6.8872,
    score: 9.4,
    tags: ['montagne', 'neige'],
  },
];

function distanceKm(a, b) {
  const earthRadius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function listPlaces({ category, lat, lng, radiusKm = 25 }) {
  const hasLocation = lat !== undefined && lng !== undefined;
  const origin = hasLocation ? { lat: Number(lat), lng: Number(lng) } : null;

  return places
    .map((place) => ({
      ...place,
      distanceKm: origin ? Number(distanceKm(origin, place).toFixed(1)) : undefined,
    }))
    .filter((place) => !category || place.category.toLowerCase() === String(category).toLowerCase())
    .filter((place) => !origin || place.distanceKm <= Number(radiusKm))
    .sort((a, b) => (a.distanceKm ?? b.score) - (b.distanceKm ?? a.score));
}

module.exports = {
  mapService: {
    categories: ['Temple', 'Food', 'Montagne', 'Vue', 'Marche'],
    listPlaces,
  },
};
