import { useCallback, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, Card, Muted, Button, Badge } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

const LABEL: Record<string, { t: string; tone: any }> = {
  REQUESTED: { t: "En attente", tone: "warning" }, REFUSED: { t: "Refusée", tone: "danger" },
  AWAITING_PAYMENT: { t: "À payer", tone: "warning" }, PAID: { t: "Payée", tone: "success" },
  EN_ROUTE: { t: "En route", tone: "success" }, ARRIVED: { t: "Arrivé", tone: "success" },
  IN_PROGRESS: { t: "En cours", tone: "default" }, COMPLETED: { t: "Terminée", tone: "success" },
  CANCELLED: { t: "Annulée", tone: "default" }, EXPIRED: { t: "Expirée", tone: "default" },
};

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

  const paidStatuses = ["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"];

  return (
    <Screen>
      <Topbar title="Mes réservations" />
      {loading ? <ActivityIndicator color="#2fe0a6" /> : items.length === 0 ? <Muted>Aucune réservation.</Muted> : items.map((b) => {
        const s = LABEL[b.status] ?? { t: b.status, tone: "default" };
        return (
          <Card key={b.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-white">{b.service.name}</Text>
              <Badge text={s.t} tone={s.tone} />
            </View>
            <Muted>avec {b.nurse.user.firstName} {b.nurse.user.lastName} · {b.price} TND</Muted>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {b.status === "AWAITING_PAYMENT" && <Button title="Payer" onPress={() => pay(b.id)} loading={paying === b.id} />}
              {["EN_ROUTE", "ARRIVED"].includes(b.status) && <Button title="Suivre" variant="ghost" onPress={() => router.push(`/track/${b.id}`)} />}
              {paidStatuses.includes(b.status) && <Button title="Chat" variant="ghost" onPress={() => openChat(b.id)} />}
              {b.status === "COMPLETED" && !b.review && <Button title="Laisser un avis" variant="ghost" onPress={() => review(b.id)} />}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
