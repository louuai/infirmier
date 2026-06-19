import * as Location from "expo-location";

export async function getMyLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** Reverse-geocoding : coords -> { address, city }. */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
  try {
    const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const r = res[0];
    if (!r) return { address: "", city: "" };
    const parts = [r.name || r.street, r.streetNumber].filter(Boolean);
    const street = r.street && r.name && r.name !== r.street ? `${r.name}, ${r.street}` : (parts.join(" ") || r.street || r.name || "");
    const city = r.city || r.subregion || r.region || "";
    const address = [street, r.district].filter(Boolean).join(", ") || city;
    return { address, city };
  } catch {
    return { address: "", city: "" };
  }
}

/** Détecte la position ET l'adresse en une fois. */
export async function detectAddress(): Promise<{ lat: number; lng: number; address: string; city: string } | null> {
  const loc = await getMyLocation();
  if (!loc) return null;
  const a = await reverseGeocode(loc.lat, loc.lng);
  return { ...loc, ...a };
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
