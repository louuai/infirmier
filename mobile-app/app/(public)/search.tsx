import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card, Muted, Field, Button } from "@/components/ui";
import { api } from "@/api/client";
import { getMyLocation } from "@/lib/location";

interface Service { id: string; slug: string; name: string; description: string | null; price: number; }

export default function PublicSearch() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ address: "", city: "", name: "", phone: "", email: "" });

  useEffect(() => {
    api("/api/services").then((d) => setServices(d.data.services)).catch(() => {});
    getMyLocation().then(setCoords).catch(() => {});
  }, []);

  async function chooseService(s: Service) {
    setService(s);
    if (!coords) setCoords(await getMyLocation());
  }

  async function submit() {
    if (!service) return;
    if (!f.address.trim()) { Alert.alert("Adresse requise"); return; }
    if (!f.name.trim() || !f.phone.trim()) { Alert.alert("Coordonnées requises", "Nom et téléphone (sans créer de compte)."); return; }
    setLoading(true);
    try {
      const d = await api("/api/bookings", {
        method: "POST", auth: false,
        body: { serviceId: service.id, address: f.address, city: f.city || undefined, latitude: coords?.lat, longitude: coords?.lng, guestName: f.name, guestPhone: f.phone, guestEmail: f.email || undefined },
      });
      router.push(`/request/${d.data.booking.id}`);
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoading(false); }
  }

  const Header = (
    <View className="mb-4 flex-row items-center justify-between">
      <Pressable onPress={() => (service ? setService(null) : router.back())} className="flex-row items-center gap-1">
        <Ionicons name="chevron-back" size={20} color="#94a3b8" />
        <Text className="text-slate-400">{service ? "Service" : "Retour"}</Text>
      </Pressable>
      <Text className="font-extrabold text-white">Infirmier<Text className="text-sky-400">Tunis</Text></Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#03040d" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {Header}

          {!service ? (
            <>
              <Text className="text-2xl font-extrabold text-white">De quel soin{"\n"}avez-vous besoin ?</Text>
              <View className="h-2" />
              <Muted>Choisissez un service — la demande part aux infirmiers dispos, le premier qui accepte prend la mission.</Muted>
              <View className="h-4" />
              {services.length === 0 && <ActivityIndicator color="#2fe0a6" />}
              {services.map((s) => (
                <Pressable key={s.id} onPress={() => chooseService(s)} className="mb-3">
                  <Card>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 flex-row items-center gap-3">
                        <View className="size-10 items-center justify-center rounded-xl bg-sky-500/15"><Ionicons name="medkit" size={20} color="#35a8ff" /></View>
                        <Text className="flex-1 text-base font-semibold text-white">{s.name}</Text>
                      </View>
                      <Text className="font-bold text-emerald-300">{s.price} TND</Text>
                    </View>
                    {s.description && <Text className="mt-2 text-sm text-slate-400">{s.description}</Text>}
                  </Card>
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Text className="text-xl font-extrabold text-white">{service.name} · {service.price} TND</Text>
              <Muted>Tarif fixe · paiement après acceptation</Muted>
              <View className="h-4" />
              <Field label="Adresse de la visite" icon="home" value={f.address} onChangeText={(v) => setF({ ...f, address: v })} placeholder="Rue, ville..." />
              <Field label="Ville" icon="business" value={f.city} onChangeText={(v) => setF({ ...f, city: v })} />
              <Pressable onPress={async () => setCoords(await getMyLocation())} className={`mb-3 flex-row items-center gap-2 self-start rounded-full border px-4 py-2 ${coords ? "border-emerald-400/40" : "border-white/15"}`}>
                <Ionicons name="locate" size={16} color={coords ? "#2fe0a6" : "#fff"} />
                <Text className={coords ? "text-emerald-300" : "text-white"}>{coords ? "Position détectée ✓" : "Me géolocaliser"}</Text>
              </Pressable>

              <View className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Text className="mb-2 text-xs text-slate-400">Vos coordonnées (sans créer de compte)</Text>
                <Field label="Nom complet" icon="person" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
                <Field label="Téléphone" icon="call" keyboardType="phone-pad" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} />
                <Field label="Email (optionnel)" icon="mail" autoCapitalize="none" value={f.email} onChangeText={(v) => setF({ ...f, email: v })} />
              </View>

              <Button title="Envoyer la demande" icon="send" onPress={submit} loading={loading} />
              <View className="h-2" />
              <Muted>Aucun paiement maintenant. Vous payez quand un infirmier accepte.</Muted>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
