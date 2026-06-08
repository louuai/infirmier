import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Muted, Field, Button } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { getMyLocation } from "@/lib/location";

interface Service { id: string; slug: string; name: string; description: string | null; price: number; }
interface Nurse { id: string; city: string | null; ratingAverage: number; ratingCount: number; distanceKm: number | null; etaMin: number | null; user: { firstName: string; lastName: string }; }

export default function ClientHome() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => { api("/api/services").then((d) => setServices(d.data.services)); }, []);

  async function chooseService(s: Service) {
    setService(s); setLoading(true);
    const loc = await getMyLocation();
    setCoords(loc);
    const q = new URLSearchParams({ serviceSlug: s.slug });
    if (loc) { q.set("lat", String(loc.lat)); q.set("lng", String(loc.lng)); q.set("radiusKm", "30"); }
    const d = await api(`/api/nurses?${q.toString()}`);
    setNurses(d.data.items); setLoading(false);
  }

  async function book(nurse: Nurse) {
    if (!service) return;
    if (!address.trim()) { Alert.alert("Adresse requise", "Saisissez l'adresse de la visite."); return; }
    setBooking(nurse.id);
    try {
      await api("/api/bookings", { method: "POST", body: { nurseId: nurse.id, serviceId: service.id, address, latitude: coords?.lat, longitude: coords?.lng } });
      Alert.alert("Demande envoyée", "L'infirmier va l'examiner. Vous paierez après acceptation.");
      router.push("/(client)/bookings");
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setBooking(null); }
  }

  if (!service) {
    return (
      <Screen>
        <Topbar title="De quel soin avez-vous besoin ?" />
        {services.map((s) => (
          <Pressable key={s.id} onPress={() => chooseService(s)} className="mb-3">
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-white">{s.name}</Text>
                <Text className="font-semibold text-emerald-300">{s.price} TND</Text>
              </View>
              {s.description && <Muted>{s.description}</Muted>}
            </Card>
          </Pressable>
        ))}
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => { setService(null); setNurses([]); }} className="mb-2"><Text className="text-slate-400">← Changer de service</Text></Pressable>
      <Text className="mb-1 text-xl font-extrabold text-white">{service.name} · {service.price} TND</Text>
      <Field label="Adresse de la visite" value={address} onChangeText={setAddress} placeholder="Rue, ville..." />
      {loading ? <ActivityIndicator color="#2fe0a6" /> : nurses.length === 0 ? (
        <Muted>Aucun infirmier disponible autour de vous.</Muted>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={nurses}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <Card className="mb-3">
              <Text className="font-semibold text-white">{item.user.firstName} {item.user.lastName}</Text>
              <Muted>{item.city ?? "—"} {item.distanceKm != null ? `· ${item.distanceKm} km` : ""} {item.etaMin != null ? `· ~${item.etaMin} min` : ""}</Muted>
              <Text className="my-1 text-amber-300">★ {item.ratingAverage.toFixed(1)} ({item.ratingCount})</Text>
              <Button title="Demander" onPress={() => book(item)} loading={booking === item.id} />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
