import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import type { LocationSubscription } from "expo-location";
import { Screen, Card, Muted, Button, Badge } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { watchLocation } from "@/lib/location";

const AVAIL = [{ k: "AVAILABLE", l: "Disponible" }, { k: "BUSY", l: "Occupé" }, { k: "OFFLINE", l: "Hors ligne" }];

export default function NurseHome() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const sub = useRef<LocationSubscription | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api("/api/bookings"), api("/api/nurses/me")]).then(([b, p]) => {
      setItems(b.data.bookings); setProfile(p.data.nurse); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setAvail(availability: string) {
    await api("/api/nurses/me", { method: "PATCH", body: { profile: { availability } } });
    load();
  }
  async function act(id: string, action: string) {
    try { await api(`/api/bookings/${id}/status`, { method: "PATCH", body: { action } }); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
  }
  async function toggleShare(id: string) {
    if (sharingId === id) { sub.current?.remove(); sub.current = null; setSharingId(null); return; }
    const s = await watchLocation((lat, lng) => { api(`/api/tracking/${id}`, { method: "POST", body: { latitude: lat, longitude: lng } }).catch(() => {}); });
    if (s) { sub.current = s; setSharingId(id); }
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
        <Card className="mb-3"><Text className="text-amber-300">Compte en attente de validation. Déposez diplôme + CIN sur le site web.</Text></Card>
      )}
      {loading ? <ActivityIndicator color="#2fe0a6" /> : requests.length === 0 ? <Muted>Aucune demande en cours.</Muted> : requests.map((b) => (
        <Card key={b.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-white">{b.service.name} · {b.nurseAmount} TND net</Text>
            <Badge text={b.status} />
          </View>
          <Muted>{b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : b.guestName} · {b.address}</Muted>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {b.status === "REQUESTED" && <><Button title="Accepter" onPress={() => act(b.id, "accept")} /><Button title="Refuser" variant="danger" onPress={() => act(b.id, "refuse")} /></>}
            {b.status === "PAID" && <Button title="Démarrer" onPress={() => act(b.id, "en_route")} />}
            {b.status === "EN_ROUTE" && <>
              <Button title={sharingId === b.id ? "Position partagée…" : "Partager position"} variant={sharingId === b.id ? "primary" : "ghost"} onPress={() => toggleShare(b.id)} />
              <Button title="Arrivé" onPress={() => act(b.id, "arrived")} />
            </>}
            {b.status === "ARRIVED" && <Button title="Commencer" onPress={() => act(b.id, "start")} />}
            {b.status === "IN_PROGRESS" && <Button title="Terminer" onPress={() => act(b.id, "complete")} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
