import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Muted, Field, Button } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { getMyLocation } from "@/lib/location";

interface Service { id: string; slug: string; name: string; description: string | null; price: number; }

export default function ClientHome() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api("/api/services").then((d) => setServices(d.data.services)); }, []);

  async function chooseService(s: Service) {
    setService(s);
    const loc = await getMyLocation();
    setCoords(loc);
  }

  async function submit() {
    if (!service) return;
    if (!address.trim()) { Alert.alert("Adresse requise"); return; }
    setLoading(true);
    try {
      const d = await api("/api/bookings", {
        method: "POST",
        body: { serviceId: service.id, address, city: city || undefined, latitude: coords?.lat, longitude: coords?.lng },
      });
      router.push(`/request/${d.data.booking.id}`);
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoading(false); }
  }

  // Étape 1 : choix du service
  if (!service) {
    return (
      <Screen>
        <Topbar title="De quel soin avez-vous besoin ?" />
        <Muted>Choisissez un service. Votre demande part aux infirmiers dispos — le premier qui accepte prend la mission.</Muted>
        <View className="h-3" />
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

  // Étape 2 : adresse + envoi de la demande
  return (
    <Screen>
      <Pressable onPress={() => setService(null)} className="mb-2"><Text className="text-slate-400">← Changer de service</Text></Pressable>
      <Text className="mb-1 text-xl font-extrabold text-white">{service.name} · {service.price} TND</Text>
      <Muted>Tarif fixe · paiement après acceptation</Muted>
      <View className="h-4" />
      <Field label="Adresse de la visite" value={address} onChangeText={setAddress} placeholder="Rue, ville..." />
      <Field label="Ville" value={city} onChangeText={setCity} />
      <Pressable onPress={async () => setCoords(await getMyLocation())} className={`mb-3 self-start rounded-full border px-4 py-2 ${coords ? "border-emerald-400/40" : "border-white/15"}`}>
        <Text className={coords ? "text-emerald-300" : "text-white"}>{coords ? "Position détectée ✓" : "Me géolocaliser"}</Text>
      </Pressable>
      <Button title="Envoyer la demande" onPress={submit} loading={loading} />
      <View className="h-2" />
      <Muted>Aucun paiement maintenant. Vous payez quand un infirmier accepte.</Muted>
    </Screen>
  );
}
