import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, Vibration } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { LocationSubscription } from "expo-location";
import { Screen, Card, Muted, Button, Badge, Chip, FadeIn, SectionLabel, Press } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/api/client";
import { watchLocation } from "@/lib/location";
import { notifyLocal } from "@/lib/push";
import { theme, statusTone } from "@/theme";

const AVAIL = [{ k: "AVAILABLE", l: "Disponible" }, { k: "BUSY", l: "Occupé" }, { k: "OFFLINE", l: "Hors ligne" }];

export default function NurseHome() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<any>(null);
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
      setItems(b.data.bookings); setProfile(p.data.nurse); setAccess(p.data.access); setAvailable(av0); setLoading(false);
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

  // Gate SaaS : abonnement/essai expiré → accès bloqué.
  if (!loading && access && !access.active) {
    return (
      <Screen>
        <Topbar title="Espace infirmier" />
        <FadeIn>
          <Card glow>
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <Ionicons name="lock-closed" size={36} color={theme.amber} />
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", marginTop: 12 }}>Abonnement requis</Text>
              <View style={{ height: 6 }} />
              <Muted>Votre essai gratuit est terminé. Abonnez-vous pour continuer à recevoir des missions.</Muted>
            </View>
          </Card>
        </FadeIn>
        <View style={{ height: 14 }} />
        <Button title="Voir les formules d'abonnement" icon="card" onPress={() => router.push("/subscription")} />
      </Screen>
    );
  }

  const banner = access?.trialActive
    ? { txt: `Essai gratuit — ${access.daysLeft} jour(s) restant(s)`, cta: "S'abonner" }
    : access?.subActive && access.daysLeft <= 5
    ? { txt: `Abonnement expire dans ${access.daysLeft} jour(s)`, cta: "Renouveler" }
    : null;

  return (
    <Screen>
      <Topbar title="Espace infirmier" />
      {banner && (
        <FadeIn>
          <View style={{ marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(251,191,36,0.35)", backgroundColor: "rgba(251,191,36,0.10)", padding: 12 }}>
            <Ionicons name="gift" size={20} color={theme.amber} />
            <Text style={{ color: "#fcd34d", flex: 1, fontSize: 12.5 }}>{banner.txt}</Text>
            <Press onPress={() => router.push("/subscription")}><Text style={{ color: theme.teal, fontWeight: "700", fontSize: 12 }}>{banner.cta}</Text></Press>
          </View>
        </FadeIn>
      )}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {AVAIL.map((a) => (
          <Chip key={a.k} label={a.l} active={profile?.availability === a.k} onPress={() => setAvail(a.k)}
            icon={a.k === "AVAILABLE" ? "flash" : a.k === "BUSY" ? "time" : "moon"} />
        ))}
      </View>
      {profile && profile.verificationStatus !== "APPROVED" && (
        <Card className="mb-3"><View style={{ flexDirection: "row", gap: 8 }}><Ionicons name="alert-circle" size={18} color={theme.amber} /><Text style={{ color: "#fcd34d", flex: 1 }}>Compte en attente de validation. Déposez votre diplôme + CIN dans l'onglet Documents.</Text></View></Card>
      )}

      {available.length > 0 && (
        <FadeIn>
          <View style={{ marginBottom: 14, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(47,224,166,0.4)" }}>
            <LinearGradient colors={["rgba(47,224,166,0.18)", "rgba(56,189,248,0.06)"]} style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ionicons name="notifications" size={18} color={theme.teal} />
                <Text style={{ color: theme.teal, fontWeight: "800" }}>Demandes entrantes ({available.length}) — premier à accepter !</Text>
              </View>
              {available.map((a) => (
                <View key={a.id} style={{ marginBottom: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.borderSoft, padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{a.service.name}</Text>
                    <Text style={{ color: theme.teal, fontWeight: "800", fontSize: 16 }}>{a.nurseAmount} TND</Text>
                  </View>
                  <Text style={{ color: theme.textDim, fontSize: 12.5, marginTop: 3 }}>{a.guestName ?? "Client"} · {a.address}{a.distanceKm != null ? ` · ${a.distanceKm} km` : ""}</Text>
                  <View style={{ marginTop: 10 }}><Button title="Accepter la mission" icon="checkmark-circle" onPress={() => claim(a.id)} /></View>
                </View>
              ))}
            </LinearGradient>
          </View>
        </FadeIn>
      )}

      {requests.length > 0 && <SectionLabel>Mes missions</SectionLabel>}
      {loading ? <ActivityIndicator color={theme.teal} /> : requests.length === 0 && available.length === 0 ? (
        <Card><View style={{ alignItems: "center", paddingVertical: 14 }}><Ionicons name="cafe" size={28} color={theme.textFaint} /><Text style={{ color: theme.textDim, marginTop: 8 }}>Aucune demande en cours.</Text></View></Card>
      ) : requests.map((b) => (
        <Card key={b.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{b.service.name} · {b.nurseAmount} TND</Text>
            <Badge text={statusTone(b.status).label} tone={statusTone(b.status).tone} />
          </View>
          <Muted>{b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : b.guestName} · {b.address}</Muted>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {b.status === "ACCEPTED" && <Button title="Démarrer la mission" icon="navigate" onPress={() => act(b.id, "en_route")} />}
            {b.status === "EN_ROUTE" && <>
              <Button title={sharingId === b.id ? "Position partagée…" : "Partager position"} variant={sharingId === b.id ? "primary" : "ghost"} onPress={() => toggleShare(b.id)} />
              <Button title="Arrivé" onPress={() => act(b.id, "arrived")} />
            </>}
            {b.status === "ARRIVED" && <Button title="Commencer" onPress={() => act(b.id, "start")} />}
            {b.status === "IN_PROGRESS" && <Button title="Terminer" onPress={() => act(b.id, "complete")} />}
            {["ACCEPTED", "PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(b.status) && <Button title="Chat" icon="chatbubble-ellipses" variant="ghost" onPress={() => openChat(b.id)} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
