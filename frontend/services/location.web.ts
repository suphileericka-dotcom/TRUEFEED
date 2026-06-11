// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
export type UserLocation = {
  lat: number;
  lng: number;
};

export async function getCurrentLocation(): Promise<UserLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation unavailable.');
  }

  return new Promise<UserLocation>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      reject,
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  });
}
