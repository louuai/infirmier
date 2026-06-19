import { useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, Muted, Button, FadeIn } from "@/components/ui";
import { api } from "@/api/client";
import { theme } from "@/theme";

const CONFIRMED = ["ACCEPTED", "PAID", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];

export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const d = await api(`/api/bookings/${id}`);
      const b = d.data.booking;
      if (CONFIRMED.includes(b.status)) router.replace(`/track/${id}`);
      else if (["CANCELLED", "REFUSED", "EXPIRED", "COMPLETED"].includes(b.status)) router.replace("/(public)/landing");
    } catch {}
  }, [id, router]);

  useEffect(() => {
    poll();
    const i = setInterval(poll, 3000);
    return () => clearInterval(i);
  }, [poll]);

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
        <FadeIn>
          <View style={{ width: 110, height: 110, borderRadius: 999, backgroundColor: "rgba(47,224,166,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(47,224,166,0.35)" }}>
            <ActivityIndicator size="large" color={theme.teal} />
          </View>
        </FadeIn>
        <FadeIn delay={120}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 26 }}>Recherche d'un infirmier…</Text>
          <View style={{ height: 10 }} />
          <Muted>Votre demande a été envoyée aux infirmiers disponibles autour de vous. Le premier qui accepte prend la mission — vous serez redirigé vers son suivi.</Muted>
          <View style={{ height: 8 }} />
          <Text style={{ color: theme.textFaint, fontSize: 12, textAlign: "center" }}>💵 Paiement directement à l'infirmier, sur place.</Text>
        </FadeIn>
        <View style={{ height: 28 }} />
        <Button title="Annuler la recherche" variant="ghost" full={false} onPress={() => router.replace("/(public)/landing")} />
      </View>
    </Screen>
  );
}
