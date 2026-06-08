import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/client";

export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    const fetchData = () => api(`/api/tracking/${id}`).then((d) => alive && setData(d.data)).catch(() => {});
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => { alive = false; clearInterval(i); };
  }, [id]);

  const nurse = data?.nurse?.lat != null ? { latitude: data.nurse.lat, longitude: data.nurse.lng } : null;
  const dest = data?.destination?.lat != null ? { latitude: data.destination.lat, longitude: data.destination.lng } : null;
  const region = nurse || dest || { latitude: 36.8065, longitude: 10.1815 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#03040d" }}>
      <View style={{ flex: 1 }}>
        {Platform.OS === "web" ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#94a3b8" }}>Carte disponible sur l'app mobile.</Text>
          </View>
        ) : (
          <MapView style={{ flex: 1 }} initialRegion={{ ...region, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
            {nurse && <Marker coordinate={nurse} title={data?.nurse?.name} pinColor="#2fe0a6" />}
            {dest && <Marker coordinate={dest} title="Votre adresse" pinColor="#35a8ff" />}
            {nurse && dest && <Polyline coordinates={[nurse, dest]} strokeColor="#2fe0a6" strokeWidth={3} />}
          </MapView>
        )}
        {data && (
          <View style={{ position: "absolute", left: 16, right: 16, bottom: 24, backgroundColor: "#0b1220", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{data.nurse?.name}</Text>
            <Text style={{ color: "#94a3b8", marginTop: 2 }}>{data.destination?.address}</Text>
            <View style={{ flexDirection: "row", gap: 24, marginTop: 12 }}>
              <Text style={{ color: "#2fe0a6", fontWeight: "700" }}>{data.distanceKm != null ? `${data.distanceKm} km` : "—"}</Text>
              <Text style={{ color: "#35a8ff", fontWeight: "700" }}>{data.etaMin != null ? `~${data.etaMin} min` : "—"}</Text>
              <Text style={{ color: "#fff" }}>{data.status}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
