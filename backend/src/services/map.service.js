const { query } = require('../data/db');

const categories = ['Monument', 'Musee', 'Food', 'Montagne', 'Vue', 'Marche'];

function hasValidLocation(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

async function listCategories() {
  const result = await query(
    `SELECT DISTINCT category
     FROM places
     ORDER BY category ASC`,
  );
  const dbCategories = result.rows.map((row) => row.category);

  return dbCategories.length > 0 ? dbCategories : categories;
}

async function listPlaces({ category, lat, lng, radiusKm = 25 }) {
  const params = [];
  const where = [];
  const hasLocation = hasValidLocation(lat, lng);
  const radius = Math.min(Number(radiusKm) || 25, 250);

  if (category) {
    params.push(String(category));
    where.push(`lower(category) = lower($${params.length})`);
  }

  let distanceSelect = 'NULL::double precision AS distance_km';
  let distanceWhere = '';

  if (hasLocation) {
    params.push(Number(lat), Number(lng));
    const latParam = `$${params.length - 1}`;
    const lngParam = `$${params.length}`;

    distanceSelect = `
      (
        6371 * 2 * atan2(
          sqrt(
            pow(sin(radians(lat - ${latParam}) / 2), 2) +
            pow(sin(radians(lng - ${lngParam}) / 2), 2) *
            cos(radians(${latParam})) *
            cos(radians(lat))
          ),
          sqrt(
            1 - (
              pow(sin(radians(lat - ${latParam}) / 2), 2) +
              pow(sin(radians(lng - ${lngParam}) / 2), 2) *
              cos(radians(${latParam})) *
              cos(radians(lat))
            )
          )
        )
      ) AS distance_km`;
    params.push(radius);
    distanceWhere = `WHERE distance_km <= $${params.length}`;
  }

  const result = await query(
    `SELECT *
     FROM (
       SELECT id, name, category, city, lat, lng, score, tags, ${distanceSelect}
       FROM places
       ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
     ) AS places_with_distance
     ${distanceWhere}
     ORDER BY
       distance_km ASC NULLS LAST,
       CASE WHEN lower(city) = 'paris' THEN 0 ELSE 1 END ASC,
       score DESC,
       name ASC
     LIMIT 50`,
    params,
  );

  return result.rows.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    city: place.city,
    lat: place.lat,
    lng: place.lng,
    score: Number(place.score),
    tags: place.tags || [],
    distanceKm:
      place.distance_km === null || place.distance_km === undefined
        ? undefined
        : Number(Number(place.distance_km).toFixed(1)),
  }));
}

module.exports = {
  mapService: {
    categories,
    listCategories,
    listPlaces,
  },
};
