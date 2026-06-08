"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const icon = (color: string, ring: string, label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:22px">
      <span style="position:absolute;inset:-9px;border-radius:9999px;background:${ring};filter:blur(7px);opacity:.8"></span>
      <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:${color};color:#001018;font-size:11px;font-weight:700;box-shadow:0 0 14px ${color};border:2px solid #fff">${label}</span>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14],
  });

const nurseIcon = icon("#2fe0a6", "rgba(47,224,166,.7)", "🩺");
const destIcon = icon("#35a8ff", "rgba(53,168,255,.7)", "🏠");

interface Props {
  nurse: [number, number] | null;
  dest: [number, number] | null;
  nurseName?: string;
}

export default function TrackMap({ nurse, dest, nurseName }: Props) {
  const center = nurse ?? dest ?? [36.8065, 10.1815];
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution="&copy; OpenStreetMap &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {nurse && <Marker position={nurse} icon={nurseIcon}><Popup>{nurseName ?? "Infirmier"}</Popup></Marker>}
      {dest && <Marker position={dest} icon={destIcon}><Popup>Votre adresse</Popup></Marker>}
      {nurse && dest && <Polyline positions={[nurse, dest]} pathOptions={{ color: "#2fe0a6", weight: 3, dashArray: "6 8" }} />}
    </MapContainer>
  );
}
