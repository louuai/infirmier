import { useCallback, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Button, Badge } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { theme, statusTone } from "@/theme";

export default function Bookings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api("/api/bookings").then((d) => { setItems(d.data.bookings); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pay(id: string) {
    setPaying(id);
    try { await api("/api/payments", { method: "POST", body: { bookingId: id } }); Alert.alert("Paiement confirmé"); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); } finally { setPaying(null); }
  }

  async function openChat(id: string) {
    try {
      const d = await api("/api/conversations", { method: "POST", body: { bookingId: id } });
      router.push(`/chat/${d.data.conversationId}`);
    } catch (e: any) { Alert.alert("Chat indisponible", e.message); }
  }

  function review(id: string) {
    Alert.prompt?.("Votre avis", "Note de 1 à 5 :", async (val) => {
      const rating = Math.max(1, Math.min(5, parseInt(val || "5", 10)));
      try { await api("/api/reviews", { method: "POST", body: { bookingId: id, rating } }); Alert.alert("Merci pour votre avis !"); load(); }
      catch (e: any) { Alert.alert("Erreur", e.message); }
    }, "plain-text", "5");
  }

  const paidStatuses = ["ACCEPTED", "PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"];

  return (
    <Screen>
      <Topbar title="Mes réservations" />
      {loading ? <ActivityIndicator color={theme.teal} /> : items.length === 0 ? (
        <Card><View style={{ alignItems: "center", paddingVertical: 16 }}><Ionicons name="receipt-outline" size={30} color={theme.textFaint} /><Text style={{ color: theme.textDim, marginTop: 10 }}>Aucune réservation pour le moment.</Text><View style={{ height: 12 }} /><Button title="Trouver un infirmier" icon="search" full={false} onPress={() => router.push("/(client)")} /></View></Card>
      ) : items.map((b) => {
        const s = statusTone(b.status);
        const nurseName = b.nurse?.user ? `${b.nurse.user.firstName} ${b.nurse.user.lastName}` : "Recherche en cours…";
        return (
          <Card key={b.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{b.service.name}</Text>
              <Badge text={s.label} tone={s.tone} />
            </View>
            <Muted>avec {nurseName} · {b.price} TND</Muted>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {b.status === "SEARCHING" && <Button title="Voir la demande" icon="open" full={false} onPress={() => router.push(`/request/${b.id}`)} />}
              {["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status) && <Button title="Suivre l'infirmier" icon="location" full={false} onPress={() => router.push(`/track/${b.id}`)} />}
              {paidStatuses.includes(b.status) && <Button title="Chat" icon="chatbubble-ellipses" variant="ghost" full={false} onPress={() => openChat(b.id)} />}
              {b.status === "COMPLETED" && !b.review && <Button title="Laisser un avis" icon="star" variant="ghost" full={false} onPress={() => review(b.id)} />}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
