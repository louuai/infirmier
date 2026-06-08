import * as Location from "expo-location";

export async function getMyLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** Suivi continu de la position (pour l'infirmier en mission). */
export async function watchLocation(cb: (lat: number, lng: number) => void) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 20, timeInterval: 5000 },
    (pos) => cb(pos.coords.latitude, pos.coords.longitude),
  );
}
