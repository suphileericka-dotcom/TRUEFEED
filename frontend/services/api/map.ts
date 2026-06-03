import { apiClient } from './client';

export type MapPlace = {
  id: string;
  name: string;
  category: string;
  city: string;
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

export const mapApi = {
  listCategories() {
    return apiClient.get<CategoriesResponse>('/api/v1/map/categories');
  },

  listPlaces(params: ListPlacesParams = {}) {
    return apiClient.get<PlacesResponse>(`/api/v1/map/places${toQuery(params)}`);
  },
};
