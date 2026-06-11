import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { api } from "@/api/client";

export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const d = await api(`/api/bookings/${id}`);
      const b = d.data.booking;
      setBooking(b);
      if (["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)) {
        router.replace(`/track/${id}`);
      }
    } catch {}
  }, [id, router]);

  useEffect(() => {
    fetchBooking();
    const i = setInterval(fetchBooking, 3000);
    return () => clearInterval(i);
  }, [fetchBooking]);

  async function pay() {
    setPaying(true);
    try {
      const d = await api("/api/payments", { method: "POST", body: { bookingId: id } });
      if (d.redirectUrl) { Alert.alert("Paiement", "Ouvrez le lien de paiement fourni."); }
      router.replace(`/track/${id}`);
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setPaying(false); }
  }

  if (!booking) return <Screen><ActivityIndicator color="#2fe0a6" /></Screen>;

  if (booking.status === "SEARCHING") {
    return (
      <Screen>
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#2fe0a6" />
          <Text className="mt-6 text-xl font-bold text-white">Recherche d'un infirmier…</Text>
          <Muted>Demande « {booking.service.name} » envoyée aux infirmiers disponibles. Le premier qui accepte prend la mission.</Muted>
        </View>
      </Screen>
    );
  }

  if (booking.status === "AWAITING_PAYMENT" && booking.nurse) {
    return (
      <Screen>
        <View className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <Text className="text-center text-emerald-200">✅ Un infirmier a accepté votre demande !</Text>
        </View>
        <Card className="mb-3">
          <Text className="text-xl font-bold text-white">{booking.nurse.name}</Text>
          <Muted>{booking.nurse.city ?? "—"} · {booking.nurse.yearsOfExperience} ans · ★ {booking.nurse.ratingAverage?.toFixed(1)} ({booking.nurse.ratingCount})</Muted>
          {booking.nurse.bio ? <Text className="mt-2 text-slate-400">{booking.nurse.bio}</Text> : null}
        </Card>
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-slate-300">{booking.service.name}</Text>
            <Text className="text-xl font-bold text-emerald-300">{booking.price} TND</Text>
          </View>
        </Card>
        <Button title={`Accepter & Payer ${booking.price} TND`} onPress={pay} loading={paying} />
        <View className="h-2" />
        <Muted>Vous suivrez ensuite l'infirmier en temps réel.</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="items-center py-16">
        <Text className="text-xl font-bold text-white">
          Demande {booking.status === "CANCELLED" ? "annulée" : booking.status === "COMPLETED" ? "terminée" : "expirée"}
        </Text>
        <View className="h-4" />
        <Button title="Nouvelle demande" onPress={() => router.replace("/(client)")} />
      </View>
    </Screen>
  );
}
