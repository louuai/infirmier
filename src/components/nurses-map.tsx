"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

// Marqueur lumineux "astral" (divIcon) — patient en cyan, infirmiers en émeraude.
const glowIcon = (color: string, ring: string) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:18px;height:18px">
      <span style="position:absolute;inset:-8px;border-radius:9999px;background:${ring};filter:blur(6px);opacity:.7"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};box-shadow:0 0 12px ${color},0 0 22px ${color};border:2px solid rgba(255,255,255,.85)"></span>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

const meIcon = glowIcon("#35a8ff", "rgba(53,168,255,.6)");
const nurseIcon = glowIcon("#2fe0a6", "rgba(47,224,166,.6)");

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
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={center} icon={meIcon}>
        <Popup>Votre position</Popup>
      </Marker>
      {radiusKm && (
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#35a8ff", fillColor: "#2fe0a6", fillOpacity: 0.06, weight: 1 }}
        />
      )}
      {nurses
        .filter((n) => n.latitude != null && n.longitude != null)
        .map((n) => (
          <Marker key={n.id} position={[n.latitude!, n.longitude!]} icon={nurseIcon}>
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
