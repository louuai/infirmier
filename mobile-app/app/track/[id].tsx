import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/api/client";
import { Badge, Avatar, Press } from "@/components/ui";
import { theme, grad, statusTone } from "@/theme";

export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const st = data ? statusTone(data.status) : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {Platform.OS === "web" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.textDim }}>Carte disponible sur l'app mobile.</Text>
        </View>
      ) : (
        <MapView style={{ flex: 1 }} initialRegion={{ ...region, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          {nurse && <Marker coordinate={nurse} title={data?.nurse?.name} pinColor="#2fe0a6" />}
          {dest && <Marker coordinate={dest} title="Votre adresse" pinColor="#35a8ff" />}
          {nurse && dest && <Polyline coordinates={[nurse, dest]} strokeColor="#2fe0a6" strokeWidth={4} />}
        </MapView>
      )}

      {/* bouton retour */}
      <SafeAreaView style={{ position: "absolute", top: 0, left: 0 }}>
        <Press onPress={() => router.replace("/(public)/landing")}>
          <View style={{ margin: 14, width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(4,6,15,0.7)", borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </View>
        </Press>
      </SafeAreaView>

      {data && (
        <View style={{ position: "absolute", left: 14, right: 14, bottom: 26, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: theme.border, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}>
          <LinearGradient colors={["#0b1626", "#070b18"]} style={{ padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={data.nurse?.name ?? "Infirmier"} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800" }}>{data.nurse?.name ?? "Recherche…"}</Text>
                <Text style={{ color: theme.textDim, fontSize: 12.5 }} numberOfLines={1}>{data.destination?.address}</Text>
              </View>
              {st && <Badge text={st.label} tone={st.tone} />}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: theme.glass, borderRadius: 12, padding: 11 }}>
                <Ionicons name="navigate" size={16} color={theme.teal} />
                <Text style={{ color: theme.text, fontWeight: "700" }}>{data.distanceKm != null ? `${data.distanceKm} km` : "—"}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: theme.glass, borderRadius: 12, padding: 11 }}>
                <Ionicons name="time" size={16} color={theme.sky} />
                <Text style={{ color: theme.text, fontWeight: "700" }}>{data.etaMin != null ? `~${data.etaMin} min` : "—"}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}
