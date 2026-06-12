import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { api } from "@/api/client";

export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });

  const fetchBooking = useCallback(async () => {
    try {
      const d = await api(`/api/bookings/${id}`);
      const b = d.data.booking;
      setBooking(b);
      if (["PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)) router.replace(`/track/${id}`);
    } catch {}
  }, [id, router]);

  useEffect(() => {
    fetchBooking();
    const i = setInterval(fetchBooking, 3000);
    return () => clearInterval(i);
  }, [fetchBooking]);

  async function pay() {
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 12) { Alert.alert("Carte invalide", "Numéro de carte incorrect"); return; }
    if (!card.name.trim()) { Alert.alert("Nom requis"); return; }
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) { Alert.alert("Expiration invalide", "Format MM/AA"); return; }
    if (card.cvc.length < 3) { Alert.alert("CVC invalide"); return; }
    setPaying(true);
    try {
      const d = await api("/api/payments", { method: "POST", body: { bookingId: id } });
      if (d.redirectUrl) Alert.alert("Paiement", "Ouvrez le lien de paiement fourni.");
      router.replace(`/track/${id}`);
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setPaying(false); }
  }

  const inputCls = "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white";

  if (!booking) return <Screen><ActivityIndicator color="#2fe0a6" /></Screen>;

  if (booking.status === "SEARCHING") {
    return (
      <Screen>
        <View className="items-center py-16">
          <View className="mb-6 size-24 items-center justify-center rounded-full bg-emerald-500/10">
            <ActivityIndicator size="large" color="#2fe0a6" />
          </View>
          <Text className="text-xl font-bold text-white">Recherche d'un infirmier…</Text>
          <View className="h-2" />
          <Muted>Demande « {booking.service.name} » envoyée aux infirmiers dispos. Le premier qui accepte prend la mission.</Muted>
        </View>
      </Screen>
    );
  }

  if (booking.status === "AWAITING_PAYMENT" && booking.nurse) {
    return (
      <Screen>
        <View className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <Ionicons name="shield-checkmark" size={20} color="#6ee7b7" />
          <Text className="text-emerald-200">Un infirmier a accepté !</Text>
        </View>
        <Card className="mb-3">
          <Text className="text-xl font-bold text-white">{booking.nurse.name}</Text>
          <Muted>{booking.nurse.city ?? "—"} · {booking.nurse.yearsOfExperience} ans · ★ {booking.nurse.ratingAverage?.toFixed(1)} ({booking.nurse.ratingCount})</Muted>
        </Card>
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2"><Ionicons name="card" size={18} color="#35a8ff" /><Text className="font-semibold text-white">Paiement</Text></View>
            <Text className="text-xl font-bold text-emerald-300">{booking.price} TND</Text>
          </View>
          <TextInput className={inputCls + " mb-3"} keyboardType="number-pad" placeholderTextColor="#64748b" value={card.number} onChangeText={(v) => setCard({ ...card, number: v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim() })} placeholder="Numéro de carte" />
          <TextInput className={inputCls + " mb-3"} placeholderTextColor="#64748b" value={card.name} onChangeText={(v) => setCard({ ...card, name: v })} placeholder="Nom sur la carte" />
          <View className="flex-row gap-3">
            <TextInput className={inputCls + " flex-1"} keyboardType="number-pad" placeholderTextColor="#64748b" value={card.exp} onChangeText={(v) => { const d = v.replace(/\D/g, "").slice(0, 4); setCard({ ...card, exp: d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} placeholder="MM/AA" />
            <TextInput className={inputCls + " flex-1"} keyboardType="number-pad" placeholderTextColor="#64748b" value={card.cvc} onChangeText={(v) => setCard({ ...card, cvc: v.replace(/\D/g, "").slice(0, 4) })} placeholder="CVC" />
          </View>
        </Card>
        <Button title={`Payer ${booking.price} TND`} onPress={pay} loading={paying} />
        <View className="h-2" />
        <Muted>Paiement chiffré · suivi en direct ensuite</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="items-center py-16">
        <Text className="text-xl font-bold text-white">Demande {booking.status === "CANCELLED" ? "annulée" : booking.status === "COMPLETED" ? "terminée" : "expirée"}</Text>
        <View className="h-4" />
        <Button title="Nouvelle demande" onPress={() => router.replace("/(client)")} />
      </View>
    </Screen>
  );
}
