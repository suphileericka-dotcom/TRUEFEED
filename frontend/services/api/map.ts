// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { apiClient } from './client';

export type MapPlace = {
  id: string;
  name: string;
  category: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  score: number;
  tags: string[];
  distanceKm?: number;
};

type PlacesResponse = {
  items: MapPlace[];
};

type CategoriesResponse = {
  items: string[];
};

type ListPlacesParams = {
  category?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

type SearchPlacesParams = {
  q: string;
  lat?: number;
  lng?: number;
};

type NominatimPlace = {
  osm_id: number;
  osm_type: string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function toQuery(params: ListPlacesParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function getNominatimName(place: NominatimPlace) {
  return place.name || place.display_name.split(',')[0]?.trim() || 'Lieu';
}

function getNominatimCity(place: NominatimPlace) {
  return (
    place.address?.city ||
    place.address?.town ||
    place.address?.village ||
    place.address?.municipality ||
    place.address?.county ||
    place.address?.state ||
    place.address?.country ||
    'Adresse'
  );
}

function toMapPlace(place: NominatimPlace): MapPlace {
  const category = place.type || place.class || 'Lieu';

  return {
    id: `osm-${place.osm_type}-${place.osm_id}`,
    name: getNominatimName(place),
    category,
    city: getNominatimCity(place),
    address: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    score: 9,
    tags: [place.class, place.type].filter(Boolean) as string[],
  };
}

export const mapApi = {
  listCategories() {
    return apiClient.get<CategoriesResponse>('/api/v1/map/categories');
  },

  listPlaces(params: ListPlacesParams = {}) {
    return apiClient.get<PlacesResponse>(`/api/v1/map/places${toQuery(params)}`);
  },

  async searchPlaces({ q, lat, lng }: SearchPlacesParams) {
    const query = q.trim();

    if (query.length < 2) {
      return { items: [] };
    }

    const searchParams = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '6',
      'accept-language': 'fr',
    });

    if (lat !== undefined && lng !== undefined) {
      searchParams.set('lat', String(lat));
      searchParams.set('lon', String(lng));
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Map search failed: ${response.status}`);
    }

    const items = (await response.json()) as NominatimPlace[];

    return {
      items: items.map(toMapPlace).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng)),
    };
  },
};
