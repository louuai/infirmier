import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, Vibration } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { LocationSubscription } from "expo-location";
import { Screen, Card, Muted, Button, Badge } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { watchLocation } from "@/lib/location";
import { notifyLocal } from "@/lib/push";

const AVAIL = [{ k: "AVAILABLE", l: "Disponible" }, { k: "BUSY", l: "Occupé" }, { k: "OFFLINE", l: "Hors ligne" }];

export default function NurseHome() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const sub = useRef<LocationSubscription | null>(null);
  const prevCount = useRef(0);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api("/api/bookings"),
      api("/api/nurses/me"),
      api("/api/bookings/available").catch(() => ({ data: { items: [] } })),
    ]).then(([b, p, av]) => {
      const av0 = av.data.items ?? [];
      prevCount.current = av0.length;
      setItems(b.data.bookings); setProfile(p.data.nurse); setAvailable(av0); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Rafraîchit les demandes entrantes (dispatch) toutes les 5 s + notif si nouvelle demande
  useEffect(() => {
    const i = setInterval(() => {
      api("/api/bookings/available").then((d) => {
        const items = d.data.items ?? [];
        if (items.length > prevCount.current) {
          Vibration.vibrate([0, 250, 100, 250]);
          notifyLocal("🔔 Nouvelle demande !", `${items[0]?.service?.name ?? "Mission"} · ${items[0]?.nurseAmount ?? ""} TND — premier à accepter`);
        }
        prevCount.current = items.length;
        setAvailable(items);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(i);
  }, []);

  async function setAvail(availability: string) {
    await api("/api/nurses/me", { method: "PATCH", body: { profile: { availability } } });
    load();
  }
  async function act(id: string, action: string) {
    try { await api(`/api/bookings/${id}/status`, { method: "PATCH", body: { action } }); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
  }
  async function claim(id: string) {
    try { await api(`/api/bookings/${id}/claim`, { method: "POST" }); load(); }
    catch (e: any) { Alert.alert("Demande prise", e.message); load(); }
  }
  async function toggleShare(id: string) {
    if (sharingId === id) { sub.current?.remove(); sub.current = null; setSharingId(null); return; }
    const s = await watchLocation((lat, lng) => { api(`/api/tracking/${id}`, { method: "POST", body: { latitude: lat, longitude: lng } }).catch(() => {}); });
    if (s) { sub.current = s; setSharingId(id); }
  }
  async function openChat(id: string) {
    try { const d = await api("/api/conversations", { method: "POST", body: { bookingId: id } }); router.push(`/chat/${d.data.conversationId}`); }
    catch (e: any) { Alert.alert("Chat indisponible", e.message); }
  }

  const requests = items.filter((b) => !["COMPLETED", "REFUSED", "CANCELLED", "EXPIRED"].includes(b.status));

  return (
    <Screen>
      <Topbar title="Espace infirmier" />
      <View className="mb-4 flex-row gap-2">
        {AVAIL.map((a) => (
          <Pressable key={a.k} onPress={() => setAvail(a.k)} className={`rounded-full px-3 py-2 ${profile?.availability === a.k ? "bg-emerald-500" : "border border-white/15"}`}>
            <Text className={`text-xs font-medium ${profile?.availability === a.k ? "text-white" : "text-slate-400"}`}>{a.l}</Text>
          </Pressable>
        ))}
      </View>
      {profile && profile.verificationStatus !== "APPROVED" && (
        <Card className="mb-3"><Text className="text-amber-300">Compte en attente de validation. Déposez votre diplôme + CIN dans l'onglet Documents.</Text></Card>
      )}

      {available.length > 0 && (
        <View className="mb-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-4">
          <Text className="mb-2 font-semibold text-emerald-300">🔔 Demandes entrantes ({available.length}) — premier à accepter !</Text>
          {available.map((a) => (
            <View key={a.id} className="mb-2 rounded-xl bg-white/5 p-3">
              <Text className="font-semibold text-white">{a.service.name} · {a.nurseAmount} TND net</Text>
              <Muted>{a.guestName ?? "Client"} · {a.address}{a.distanceKm != null ? ` · ${a.distanceKm} km` : ""}</Muted>
              <View className="mt-2"><Button title="Accepter" onPress={() => claim(a.id)} /></View>
            </View>
          ))}
        </View>
      )}

      {loading ? <ActivityIndicator color="#2fe0a6" /> : requests.length === 0 && available.length === 0 ? <Muted>Aucune demande en cours.</Muted> : requests.map((b) => (
        <Card key={b.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-white">{b.service.name} · {b.nurseAmount} TND net</Text>
            <Badge text={b.status} />
          </View>
          <Muted>{b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : b.guestName} · {b.address}</Muted>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {b.status === "AWAITING_PAYMENT" && <Text className="text-xs text-amber-300">En attente du paiement client</Text>}
            {b.status === "PAID" && <Button title="Démarrer" onPress={() => act(b.id, "en_route")} />}
            {b.status === "EN_ROUTE" && <>
              <Button title={sharingId === b.id ? "Position partagée…" : "Partager position"} variant={sharingId === b.id ? "primary" : "ghost"} onPress={() => toggleShare(b.id)} />
              <Button title="Arrivé" onPress={() => act(b.id, "arrived")} />
            </>}
            {b.status === "ARRIVED" && <Button title="Commencer" onPress={() => act(b.id, "start")} />}
            {b.status === "IN_PROGRESS" && <Button title="Terminer" onPress={() => act(b.id, "complete")} />}
            {["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(b.status) && <Button title="Chat" variant="ghost" onPress={() => openChat(b.id)} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
