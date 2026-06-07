"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

// Icône par défaut Leaflet (corrige les chemins cassés sous bundler).
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapNurse {
  id: string;
  latitude: number | null;
  longitude: number | null;
  pricePerVisit: number;
  user: { firstName: string; lastName: string };
}

interface Props {
  center: [number, number];
  radiusKm?: number;
  nurses: MapNurse[];
}

export default function NursesMap({ center, radiusKm, nurses }: Props) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center} icon={icon}>
        <Popup>Votre position</Popup>
      </Marker>
      {radiusKm && (
        <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#1f9bcf", fillOpacity: 0.05 }} />
      )}
      {nurses
        .filter((n) => n.latitude != null && n.longitude != null)
        .map((n) => (
          <Marker key={n.id} position={[n.latitude!, n.longitude!]} icon={icon}>
            <Popup>
              <strong>
                {n.user.firstName} {n.user.lastName}
              </strong>
              <br />
              {n.pricePerVisit} TND / visite
              <br />
              <a href={`/nurses/${n.id}`}>Voir le profil →</a>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
