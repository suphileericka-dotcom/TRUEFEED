// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import * as Location from 'expo-location';

export type UserLocation = {
  lat: number;
  lng: number;
};

export async function getCurrentLocation(): Promise<UserLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Location permission denied.');
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: current.coords.latitude,
    lng: current.coords.longitude,
  };
}
